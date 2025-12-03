const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');
const fetch = require('node-fetch');
const sax = require('sax');

let mainWindow;

function createWindow() {
    // Load custom icon - use .icns for macOS, .png for others
    let iconPath;
    if (process.platform === 'darwin') {
        // macOS - use .icns for proper Dock icon
        iconPath = path.join(__dirname, 'build', 'icon.icns');
        if (!fs.existsSync(iconPath)) {
            iconPath = path.join(__dirname, 'build', 'icon.png');
        }
    } else {
        // Windows/Linux - use .png
        iconPath = path.join(__dirname, 'build', 'icon.png');
    }
    
    const iconExists = fs.existsSync(iconPath);
    
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        icon: iconExists ? iconPath : undefined,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('app.html');
    
    // Open DevTools in development (disabled for production)
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle file selection
ipcMain.handle('select-file', async (event, title) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: title,
        properties: ['openFile'],
        filters: [
            { name: 'XML Files', extensions: ['xml'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

// Parse XML catalog using streaming SAX parser for large files
async function parseXMLCatalog(filePath, sendProgress) {
    return new Promise((resolve, reject) => {
        sendProgress({ type: 'log', message: '🔄 Using streaming parser for large files...' });
        sendProgress({ type: 'parsing', message: 'Streaming catalog file...' });
        
        const products = new Map();
        const variantMap = new Map();
        let productCount = 0;
        
        // Current product being parsed
        let currentProduct = null;
        let currentPath = [];
        let currentText = '';
        
        try {
            // SAX streaming parser
            const saxStream = sax.createStream(true);
            const fileStream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 64 * 1024 });
        
        saxStream.on('opentag', (node) => {
            currentPath.push(node.name);
            currentText = '';
            
            // Start of a product element
            if (node.name === 'product' && currentPath.length === 2) {
                currentProduct = {
                    productId: node.attributes['product-id'],
                    images: null,
                    variations: null,
                    imageGroups: [],
                    variants: []
                };
            }
            
            // Image group
            if (node.name === 'image-group' && currentProduct) {
                if (!currentProduct.imageGroups) currentProduct.imageGroups = [];
                currentProduct.imageGroups.push({
                    viewType: node.attributes['view-type'],
                    images: []
                });
            }
            
            // Image path
            if (node.name === 'image' && currentProduct && currentProduct.imageGroups && currentProduct.imageGroups.length > 0) {
                const currentGroup = currentProduct.imageGroups[currentProduct.imageGroups.length - 1];
                if (node.attributes['path']) {
                    currentGroup.images.push(node.attributes['path']);
                }
            }
            
            // Variant
            if (node.name === 'variant' && currentProduct) {
                const variantId = node.attributes['product-id'];
                if (variantId) {
                    currentProduct.variants.push(variantId);
                }
            }
        });
        
        saxStream.on('closetag', (tagName) => {
            // End of product element
            if (tagName === 'product' && currentProduct && currentPath.length === 2) {
                productCount++;
                
                if (productCount % 1000 === 0) {
                    sendProgress({ type: 'parsing', count: productCount });
                }
                
                if (currentProduct.productId) {
                    // Convert imageGroups array to structured format
                    if (currentProduct.imageGroups && currentProduct.imageGroups.length > 0) {
                        currentProduct.images = { 'image-group': currentProduct.imageGroups };
                    }
                    delete currentProduct.imageGroups;
                    
                    // Map variants
                    if (currentProduct.variants && currentProduct.variants.length > 0) {
                        currentProduct.variants.forEach(variantId => {
                            variantMap.set(variantId, currentProduct.productId);
                        });
                        currentProduct.variations = { hasVariants: true };
                    }
                    delete currentProduct.variants;
                    
                    products.set(currentProduct.productId, currentProduct);
                }
                
                currentProduct = null;
            }
            
            currentPath.pop();
            currentText = '';
        });
        
            saxStream.on('end', () => {
                sendProgress({ type: 'parsing', message: `Parsed ${productCount} products` });
                resolve({ products, variantMap, productCount });
            });
            
            saxStream.on('error', (error) => {
                sendProgress({ type: 'log', message: `❌ SAX error: ${error.message}` });
                reject(error);
            });
            
            fileStream.on('error', (error) => {
                sendProgress({ type: 'log', message: `❌ File error: ${error.message}` });
                reject(error);
            });
            
            fileStream.pipe(saxStream);
            
        } catch (error) {
            sendProgress({ type: 'log', message: `❌ Setup error: ${error.message}` });
            reject(error);
        }
    });
}

// Parse storefront catalog for category assignments using streaming
async function parseStorefrontCatalog(filePath, sendProgress) {
    return new Promise((resolve, reject) => {
        sendProgress({ type: 'parsing-storefront', message: 'Streaming storefront catalog...' });
        
        const categoryAssignments = new Set();
        let count = 0;
        
        const saxStream = sax.createStream(true);
        const fileStream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 64 * 1024 });
        
        saxStream.on('opentag', (node) => {
            if (node.name === 'category-assignment') {
                const productId = node.attributes['product-id'];
                if (productId) {
                    count++;
                    categoryAssignments.add(productId);
                    
                    if (count % 1000 === 0) {
                        sendProgress({ type: 'parsing-storefront', count });
                    }
                }
            }
        });
        
        saxStream.on('end', () => {
            sendProgress({ type: 'parsing-storefront', message: `Found ${count} category assignments` });
            resolve({ categoryAssignments, count });
        });
        
        saxStream.on('error', (error) => {
            reject(error);
        });
        
        fileStream.on('error', (error) => {
            reject(error);
        });
        
        fileStream.pipe(saxStream);
    });
}

// WebDAV PROPFIND request
async function getWebDAVFiles(hostname, remotePath, username, password, basePathToStrip, sendProgress) {
    const authHeader = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
    
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
        <D:propfind xmlns:D="DAV:">
            <D:allprop/>
        </D:propfind>`;
    
    const response = await fetch(hostname + remotePath, {
        method: 'PROPFIND',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/xml; charset=utf-8',
            'Depth': 'infinity'
        },
        body: propfindBody
    });
    
    if (!response.ok) {
        throw new Error(`WebDAV request failed: ${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        parseAttributeValue: false,
        trimValues: true,
        removeNSPrefix: true  // Remove namespace prefixes like D:
    });
    
    const result = parser.parse(xmlText);
    const filepaths = new Set();
    let fileCount = 0;
    
    // Navigate WebDAV response structure
    if (result.multistatus && result.multistatus.response) {
        const responses = Array.isArray(result.multistatus.response) 
            ? result.multistatus.response 
            : [result.multistatus.response];
        
        responses.forEach(resp => {
            const href = resp.href;
            const propstat = resp.propstat;
            
            let isCollection = false;
            if (propstat) {
                const propstatArray = Array.isArray(propstat) ? propstat : [propstat];
                for (const ps of propstatArray) {
                    if (ps.prop && ps.prop.resourcetype && ps.prop.resourcetype.collection !== undefined) {
                        isCollection = true;
                        break;
                    }
                }
            }
            
            if (href && !isCollection) {
                fileCount++;
                
                if (fileCount % 1000 === 0) {
                    sendProgress({ type: 'webdav-scan', count: fileCount });
                }
                
                let normalizedPath = decodeURIComponent(href);
                normalizedPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
                
                if (basePathToStrip) {
                    const baseToStrip = basePathToStrip.startsWith('/') ? basePathToStrip.substring(1) : basePathToStrip;
                    if (normalizedPath.startsWith(baseToStrip)) {
                        normalizedPath = normalizedPath.substring(baseToStrip.length);
                    }
                }
                
                normalizedPath = normalizedPath.replace(/\\/g, '/').toLowerCase().trim().replace(/^\/+|\/+$/g, '');
                if (normalizedPath) {
                    filepaths.add(normalizedPath);
                }
            }
        });
    }
    
    return filepaths;
}

// Main analysis handler
ipcMain.handle('analyze', async (event, options) => {
    const { masterCatalogPath, storefrontCatalogPath, viewType, webdavUrl, username, password } = options;
    
    const sendProgress = (data) => {
        event.sender.send('analysis-progress', data);
    };
    
    try {
        // Parse URL
        const url = new URL(webdavUrl);
        const hostname = url.origin;
        const remoteLibraryPath = url.pathname;
        
        // 1. Parse master catalog
        sendProgress({ type: 'log', message: 'Parsing master catalog...' });
        const { products, variantMap, productCount } = await parseXMLCatalog(masterCatalogPath, sendProgress);
        sendProgress({ type: 'log', message: `✓ Parsed ${productCount} products from master catalog` });
        sendProgress({ type: 'log', message: `✓ Mapped ${variantMap.size} variants to master products` });
        
        // 2. Parse storefront catalog
        sendProgress({ type: 'log', message: 'Parsing storefront catalog...' });
        const { categoryAssignments } = await parseStorefrontCatalog(storefrontCatalogPath, sendProgress);
        sendProgress({ type: 'log', message: `✓ Found ${categoryAssignments.size} category assignments` });
        
        // 3. Analyze products for missing images
        sendProgress({ type: 'log', message: `Analyzing products for missing image groups (view-type='${viewType}')...` });
        
        const missingProducts = [];
        const pathsToCheck = new Map();
        let variantsMappedCount = 0;
        let productsNotFoundCount = 0;
        
        for (const categorizedProductId of categoryAssignments) {
            let productToAnalyzeId = categorizedProductId;
            
            // Check if it's a variant
            if (variantMap.has(categorizedProductId)) {
                productToAnalyzeId = variantMap.get(categorizedProductId);
                variantsMappedCount++;
            }
            
            const product = products.get(productToAnalyzeId);
            
            if (!product) {
                productsNotFoundCount++;
                continue;
            }
            
            // Check for image group
            let hasImageGroup = false;
            let imagePaths = [];
            
            if (product.images && product.images['image-group']) {
                const imageGroups = Array.isArray(product.images['image-group']) 
                    ? product.images['image-group'] 
                    : [product.images['image-group']];
                
                for (const group of imageGroups) {
                    // Handle both old format (from XML parser) and new format (from SAX streaming)
                    const groupViewType = group['@_view-type'] || group.viewType;
                    
                    if (groupViewType === viewType) {
                        hasImageGroup = true;
                        
                        // Handle old format (img.path) and new format (group.images array)
                        if (group.images && Array.isArray(group.images)) {
                            imagePaths.push(...group.images);
                        } else if (group.image) {
                            const images = Array.isArray(group.image) ? group.image : [group.image];
                            images.forEach(img => {
                                if (img['@_path']) {
                                    imagePaths.push(img['@_path']);
                                }
                            });
                        }
                        break;
                    }
                }
            }
            
            if (!hasImageGroup) {
                missingProducts.push({
                    productId: categorizedProductId,
                    reason: `Missing image group for view-type '${viewType}'`,
                    imagePath: ''
                });
            } else if (imagePaths.length === 0) {
                missingProducts.push({
                    productId: categorizedProductId,
                    reason: `Image group for view-type '${viewType}' exists but is empty`,
                    imagePath: ''
                });
            } else {
                imagePaths.forEach(originalPath => {
                    const normalizedPath = originalPath.replace(/\\/g, '/').toLowerCase().trim().replace(/^\/+|\/+$/g, '');
                    if (normalizedPath) {
                        pathsToCheck.set(normalizedPath, { productId: categorizedProductId, originalPath });
                    }
                });
            }
        }
        
        if (variantsMappedCount > 0) {
            sendProgress({ type: 'log', message: `✓ Mapped ${variantsMappedCount} variant products to their masters` });
        }
        if (productsNotFoundCount > 0) {
            sendProgress({ type: 'log', message: `⚠️  ${productsNotFoundCount} products not found in master catalog (skipped)` });
            
            const missingPercentage = (productsNotFoundCount / categoryAssignments.size) * 100;
            if (missingPercentage > 50) {
                sendProgress({ type: 'log', message: `ℹ️  Note: ${missingPercentage.toFixed(0)}% of products not found in master catalog. Possible reasons:` });
                sendProgress({ type: 'log', message: `   • Mismatched catalogs (e.g., CI storefront + STG master)` });
                sendProgress({ type: 'log', message: `   • Using a partial/test master catalog file` });
            }
        }
        
        sendProgress({ type: 'log', message: `✓ Found ${missingProducts.length} products with image group issues` });
        sendProgress({ type: 'log', message: `✓ Found ${pathsToCheck.size} image paths to check against WebDAV` });
        
        // 4. Check WebDAV
        if (pathsToCheck.size > 0) {
            sendProgress({ type: 'log', message: 'Connecting to WebDAV server...' });
            const actualFiles = await getWebDAVFiles(hostname, remoteLibraryPath, username, password, remoteLibraryPath, sendProgress);
            sendProgress({ type: 'log', message: `✓ Found ${actualFiles.size} files on WebDAV` });
            
            sendProgress({ type: 'log', message: `Checking ${pathsToCheck.size} image paths against WebDAV...` });
            let missingFileCount = 0;
            
            for (const [normalizedPath, { productId, originalPath }] of pathsToCheck) {
                if (!actualFiles.has(normalizedPath)) {
                    missingFileCount++;
                    missingProducts.push({
                        productId: productId,
                        reason: 'File not found on WebDAV',
                        imagePath: originalPath
                    });
                }
            }
            
            sendProgress({ type: 'log', message: `✓ Found ${missingFileCount} missing image files on WebDAV` });
        }
        
        // 5. Generate summary
        const missingGroupCount = missingProducts.filter(p => p.reason.includes('Missing image group')).length;
        const emptyGroupCount = missingProducts.filter(p => p.reason.includes('exists but is empty')).length;
        const missingWebDAVCount = missingProducts.filter(p => p.reason === 'File not found on WebDAV').length;
        
        sendProgress({ type: 'log', message: '========================================' });
        sendProgress({ type: 'log', message: 'Analysis Complete!' });
        sendProgress({ type: 'log', message: `Summary:` });
        sendProgress({ type: 'log', message: `  - ${missingGroupCount} products missing image-group for view-type '${viewType}'` });
        sendProgress({ type: 'log', message: `  - ${emptyGroupCount} products with empty image-group` });
        sendProgress({ type: 'log', message: `  - ${missingWebDAVCount} products with image paths not found on WebDAV` });
        sendProgress({ type: 'log', message: `  - Total: ${missingProducts.length} issues` });
        
        return {
            success: true,
            missingProducts,
            summary: {
                total: missingProducts.length,
                missingGroups: missingGroupCount,
                emptyGroups: emptyGroupCount,
                missingFiles: missingWebDAVCount
            }
        };
        
    } catch (error) {
        sendProgress({ type: 'log', message: `Error: ${error.message}` });
        return {
            success: false,
            error: error.message
        };
    }
});

// Handle CSV download
ipcMain.handle('save-csv', async (event, csvData, viewType) => {
    // Generate filename with view type and current date
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0');
    
    // Sanitize view type for filename (remove special characters)
    const sanitizedViewType = viewType.replace(/[^a-zA-Z0-9-_]/g, '_');
    const defaultFilename = `${sanitizedViewType}_missing-image-report_${dateStr}.csv`;
    
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Missing Images Report',
        defaultPath: defaultFilename,
        filters: [
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    
    if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, csvData);
        return { success: true, path: result.filePath };
    }
    
    return { success: false };
});

