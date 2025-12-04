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
        let currentSiteOnlineFlag = null;
        
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
                    onlineFlag: node.attributes['online-flag'],
                    siteOnlineFlags: new Map(),
                    images: null,
                    variations: null,
                    imageGroups: [],
                    variants: []
                };
            }
            
            // Site-specific online-flag element (child of product)
            if (node.name === 'online-flag' && currentProduct && currentPath[currentPath.length - 2] === 'product') {
                const nodeSiteId = node.attributes['site-id'] || node.attributes['xml:lang'];
                if (nodeSiteId) {
                    currentSiteOnlineFlag = { siteId: nodeSiteId };
                } else {
                    currentSiteOnlineFlag = null;
                }
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
        
        saxStream.on('text', (text) => {
            // Capture online-flag text content
            if (currentPath[currentPath.length - 1] === 'online-flag' && currentProduct) {
                const trimmedText = text.trim();
                if (trimmedText && currentSiteOnlineFlag) {
                    // This is a site-specific online-flag value
                    currentProduct.siteOnlineFlags.set(currentSiteOnlineFlag.siteId, trimmedText);
                } else if (trimmedText && !currentSiteOnlineFlag) {
                    // This is the global online-flag element value
                    if (!currentProduct.onlineFlag) {
                        currentProduct.onlineFlag = trimmedText;
                    }
                }
            }
        });
        
        saxStream.on('closetag', (tagName) => {
            // Reset site-specific online-flag tracker
            if (tagName === 'online-flag') {
                currentSiteOnlineFlag = null;
            }
            
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
                    
                    // Keep online flag data for later filtering
                    // Don't delete onlineFlag or siteOnlineFlags - we'll use them during analysis
                    
                    products.set(currentProduct.productId, currentProduct);
                }
                
                currentProduct = null;
            }
            
            currentPath.pop();
            currentText = '';
        });
        
            saxStream.on('end', () => {
                sendProgress({ type: 'parsing', message: `Parsed ${productCount} products from master catalog` });
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
    const { masterCatalogPath, storefrontCatalogPath, viewType, siteId, webdavUrl, username, password } = options;
    
    const sendProgress = (data) => {
        event.sender.send('analysis-progress', data);
    };
    
    try {
        // Parse URL
        const url = new URL(webdavUrl);
        const hostname = url.origin;
        const remoteLibraryPath = url.pathname;
        
        // 1. Parse storefront catalog first (smaller file, faster)
        sendProgress({ type: 'log', message: 'Step 1: Parsing storefront catalog for categorized products...' });
        const { categoryAssignments } = await parseStorefrontCatalog(storefrontCatalogPath, sendProgress);
        sendProgress({ type: 'log', message: `✓ Found ${categoryAssignments.size} categorized products` });
        
        // 2. Parse master catalog (all products - needed for variant mapping and images)
        sendProgress({ type: 'log', message: 'Step 2: Parsing master catalog for product images and variants...' });
        const { products, variantMap, productCount } = await parseXMLCatalog(masterCatalogPath, sendProgress);
        sendProgress({ type: 'log', message: `✓ Parsed ${productCount} products from master catalog` });
        sendProgress({ type: 'log', message: `✓ Mapped ${variantMap.size} variants to master products` });
        
        // 3. Analyze categorized products for missing images (filter by online flag)
        const viewTypeMessage = viewType ? `view-type='${viewType}'` : 'all view types';
        const siteIdMessage = siteId ? ` for site '${siteId}'` : '';
        sendProgress({ type: 'log', message: `Step 3: Analyzing categorized products${siteIdMessage} (${viewTypeMessage})...` });
        sendProgress({ type: 'log', message: `  └─ Filtering to only online products` });
        sendProgress({ type: 'log', message: `  └─ Looking up images from master catalog` });
        
        const missingProducts = [];
        const pathsToCheck = new Map();
        let variantsMappedCount = 0;
        let productsNotFoundCount = 0;
        let offlineProductCount = 0;
        let onlineProductCount = 0;
        const checkAllViewTypes = !viewType || viewType.trim() === '';
        let debugCount = 0;
        
        for (const categorizedProductId of categoryAssignments) {
            let productToAnalyzeId = categorizedProductId;
            let isVariant = false;
            
            // Check if it's a variant
            if (variantMap.has(categorizedProductId)) {
                productToAnalyzeId = variantMap.get(categorizedProductId);
                isVariant = true;
                variantsMappedCount++;
            }
            
            const product = products.get(productToAnalyzeId);
            
            if (!product) {
                productsNotFoundCount++;
                continue;
            }
            
            // Check if product is online
            let flagToCheck = null;
            let flagSource = '';
            
            if (siteId && siteId.trim() !== '') {
                // User specified a Site ID - use site-specific online-flag
                if (product.siteOnlineFlags && product.siteOnlineFlags.has(siteId)) {
                    flagToCheck = product.siteOnlineFlags.get(siteId);
                    flagSource = `site-specific (${siteId})`;
                } else {
                    // Site ID specified but not found for this product - check global as fallback
                    flagToCheck = product.onlineFlag;
                    flagSource = `global (site '${siteId}' not found)`;
                }
            } else {
                // No Site ID specified - use global online-flag attribute
                flagToCheck = product.onlineFlag;
                flagSource = 'global attribute';
            }
            
            const onlineFlagValue = flagToCheck ? flagToCheck.toLowerCase() : null;
            const isOnline = onlineFlagValue === 'true';
            
            if (!isOnline) {
                offlineProductCount++;
                continue;
            }
            
            // Product is online - increment counter
            onlineProductCount++;
            
            // Debug: Log first 5 online products
            if (debugCount < 5) {
                debugCount++;
                const variantInfo = isVariant ? ` (variant of ${productToAnalyzeId})` : ' (standalone/master)';
                sendProgress({ 
                    type: 'log', 
                    message: `Debug - Product "${categorizedProductId}"${variantInfo} -> online (${flagSource})` 
                });
            }
            
            // Check for image group(s)
            let hasImageGroup = false;
            let imagePaths = [];
            
            if (product.images && product.images['image-group']) {
                const imageGroups = Array.isArray(product.images['image-group']) 
                    ? product.images['image-group'] 
                    : [product.images['image-group']];
                
                for (const group of imageGroups) {
                    // Handle both old format (from XML parser) and new format (from SAX streaming)
                    const groupViewType = group['@_view-type'] || group.viewType;
                    
                    // If checking all view types OR this group matches the specified view type
                    if (checkAllViewTypes || groupViewType === viewType) {
                        hasImageGroup = true;
                        
                        // Handle old format (img.path) and new format (group.images array)
                        if (group.images && Array.isArray(group.images)) {
                            group.images.forEach(imgPath => {
                                imagePaths.push({ path: imgPath, viewType: groupViewType });
                            });
                        } else if (group.image) {
                            const images = Array.isArray(group.image) ? group.image : [group.image];
                            images.forEach(img => {
                                if (img['@_path']) {
                                    imagePaths.push({ path: img['@_path'], viewType: groupViewType });
                                }
                            });
                        }
                        
                        // If checking specific view type, break after finding it
                        if (!checkAllViewTypes) {
                            break;
                        }
                    }
                }
            }
            
            if (!hasImageGroup) {
                const reason = checkAllViewTypes 
                    ? 'Missing image groups (no image groups found)'
                    : `Missing image group for view-type '${viewType}'`;
                missingProducts.push({
                    productId: categorizedProductId,
                    reason: reason,
                    imagePath: '',
                    viewType: viewType || 'all'
                });
            } else if (imagePaths.length === 0) {
                const reason = checkAllViewTypes 
                    ? 'Image groups exist but are empty'
                    : `Image group for view-type '${viewType}' exists but is empty`;
                missingProducts.push({
                    productId: categorizedProductId,
                    reason: reason,
                    imagePath: '',
                    viewType: viewType || 'all'
                });
            } else {
                imagePaths.forEach(({ path: originalPath, viewType: imgViewType }) => {
                    const normalizedPath = originalPath.replace(/\\/g, '/').toLowerCase().trim().replace(/^\/+|\/+$/g, '');
                    if (normalizedPath) {
                        pathsToCheck.set(normalizedPath, { 
                            productId: categorizedProductId,
                            masterProductId: productToAnalyzeId,
                            originalPath, 
                            viewType: imgViewType,
                            isVariant: isVariant
                        });
                    }
                });
            }
        }
        
        sendProgress({ type: 'log', message: `✓ Results: ${onlineProductCount} online & categorized products to analyze` });
        if (variantsMappedCount > 0) {
            sendProgress({ type: 'log', message: `  └─ ${variantsMappedCount} variants mapped to masters` });
        }
        if (offlineProductCount > 0) {
            sendProgress({ type: 'log', message: `  └─ ${offlineProductCount} offline products (skipped)` });
        }
        if (productsNotFoundCount > 0) {
            sendProgress({ type: 'log', message: `  └─ ${productsNotFoundCount} not found in master catalog (skipped)` });
            
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
            
            for (const [normalizedPath, { productId, masterProductId, originalPath, viewType: imgViewType, isVariant }] of pathsToCheck) {
                if (!actualFiles.has(normalizedPath)) {
                    missingFileCount++;
                    
                    missingProducts.push({
                        productId: productId,
                        masterProductId: isVariant ? masterProductId : '',
                        reason: 'File not found on WebDAV',
                        imagePath: originalPath,
                        viewType: imgViewType || viewType || 'all'
                    });
                }
            }
            
            sendProgress({ type: 'log', message: `✓ Found ${missingFileCount} missing image files on WebDAV` });
        }
        
        // 5. Generate summary
        const missingGroupCount = missingProducts.filter(p => p.reason.includes('Missing image group')).length;
        const emptyGroupCount = missingProducts.filter(p => p.reason.includes('exists but is empty')).length;
        const missingWebDAVCount = missingProducts.filter(p => p.reason === 'File not found on WebDAV').length;
        
        const viewTypeSummary = checkAllViewTypes ? 'all view types' : `view-type '${viewType}'`;
        
        sendProgress({ type: 'log', message: '========================================' });
        sendProgress({ type: 'log', message: 'Analysis Complete!' });
        sendProgress({ type: 'log', message: `Summary (checking ${viewTypeSummary}):` });
        sendProgress({ type: 'log', message: `  - ${missingGroupCount} products missing image groups` });
        sendProgress({ type: 'log', message: `  - ${emptyGroupCount} products with empty image groups` });
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
    // Generate filename with view type, current date, and timestamp
    const now = new Date();
    const dateStr = now.getFullYear() + '-' + 
                    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(now.getDate()).padStart(2, '0');
    const timeStr = String(now.getHours()).padStart(2, '0') + '-' +
                    String(now.getMinutes()).padStart(2, '0') + '-' +
                    String(now.getSeconds()).padStart(2, '0');
    
    // Sanitize view type for filename (remove special characters)
    const sanitizedViewType = viewType && viewType.trim() 
        ? viewType.replace(/[^a-zA-Z0-9-_]/g, '_')
        : 'all-view-types';
    const defaultFilename = `${sanitizedViewType}_missing-image-report_${dateStr}_${timeStr}.csv`;
    
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

