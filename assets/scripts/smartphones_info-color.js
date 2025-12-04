// Color data for smartphones - stores color button names and information
const SMARTPHONE_COLORS = {
    'iPhone 16 Pro': [
        { name: 'Black Titanium', hex: '#1a1a1a', productIdSuffix: 'black-titanium' },
        { name: 'White Titanium', hex: '#f5f5f0', productIdSuffix: 'white-titanium' },
        { name: 'Natural Titanium', hex: '#8b7355', productIdSuffix: 'natural-titanium' },
        { name: 'Desert Titanium', hex: '#d2b48c', productIdSuffix: 'desert-titanium' }
    ],
    'iPhone 16 Pro Max': [
        { name: 'Black Titanium', hex: '#1a1a1a', productIdSuffix: 'black-titanium' },
        { name: 'White Titanium', hex: '#f5f5f0', productIdSuffix: 'white-titanium' },
        { name: 'Natural Titanium', hex: '#8b7355', productIdSuffix: 'natural-titanium' },
        { name: 'Desert Titanium', hex: '#d2b48c', productIdSuffix: 'desert-titanium' }
    ],
    'iPhone 16': [
        { name: 'Black', hex: '#1a1a1a', productIdSuffix: 'black' },
        { name: 'White', hex: '#f8f8f8', productIdSuffix: 'white' },
        { name: 'Pink', hex: '#ff69b4', productIdSuffix: 'pink' },
        { name: 'Teal', hex: '#008080', productIdSuffix: 'teal' },
        { name: 'Ultramarine', hex: '#4169e1', productIdSuffix: 'ultramarine' }
    ],
    'iPhone 16 Plus': [
        { name: 'Black', hex: '#1a1a1a', productIdSuffix: 'black' },
        { name: 'White', hex: '#f8f8f8', productIdSuffix: 'white' },
        { name: 'Pink', hex: '#ff69b4', productIdSuffix: 'pink' },
        { name: 'Teal', hex: '#008080', productIdSuffix: 'teal' },
        { name: 'Ultramarine', hex: '#4169e1', productIdSuffix: 'ultramarine' }
    ],
    'iPhone 15': [
        { name: 'Black', hex: '#1a1a1a', productIdSuffix: 'black' },
        { name: 'White', hex: '#f8f8f8', productIdSuffix: 'white' },
        { name: 'Pink', hex: '#ff69b4', productIdSuffix: 'pink' },
        { name: 'Yellow', hex: '#ffd700', productIdSuffix: 'yellow' },
        { name: 'Green', hex: '#228b22', productIdSuffix: 'green' },
        { name: 'Blue', hex: '#4169e1', productIdSuffix: 'blue' }
    ],
    'iPhone 15 Plus': [
        { name: 'Black', hex: '#1a1a1a', productIdSuffix: 'black' },
        { name: 'White', hex: '#f8f8f8', productIdSuffix: 'white' },
        { name: 'Pink', hex: '#ff69b4', productIdSuffix: 'pink' },
        { name: 'Yellow', hex: '#ffd700', productIdSuffix: 'yellow' },
        { name: 'Green', hex: '#228b22', productIdSuffix: 'green' },
        { name: 'Blue', hex: '#4169e1', productIdSuffix: 'blue' }
    ],
    'Huawei Pura 80 Pro': [
        { name: 'Glazed Red', hex: '#dc143c', productIdSuffix: 'glazed-red' },
        { name: 'Glazed Black', hex: '#1a1a1a', productIdSuffix: 'glazed-black' }
    ],
    'Huawei Pura 80 Ultra': [
        { name: 'Golden Black', hex: '#2f2f2f', productIdSuffix: 'golden-black' },
        { name: 'Prestige Gold', hex: '#ffd700', productIdSuffix: 'prestige-gold' }
    ],
    'Huawei Nova 13i': [
        { name: 'Crystal Blue', hex: '#4169e1', productIdSuffix: 'crystal-blue' },
        { name: 'Pearl White', hex: '#f8f8f8', productIdSuffix: 'pearl-white' }
    ],
    'Huawei Nova Y62 Blue': [
        { name: 'Midnight Black', hex: '#1a1a1a', productIdSuffix: 'midnight-black' },
        { name: 'Crystal Blue', hex: '#4169e1', productIdSuffix: 'crystal-blue' }
    ],
    'Huawei Nova 13': [
        { name: 'Loden Green', hex: '#556b2f', productIdSuffix: 'loden-green' },
        { name: 'Midnight Black', hex: '#1a1a1a', productIdSuffix: 'midnight-black' }
    ],
    'Huawei Nova Y62 Plus': [
        { name: 'Midnight Black', hex: '#1a1a1a', productIdSuffix: 'midnight-black' },
        { name: 'Crystal Blue', hex: '#4169e1', productIdSuffix: 'crystal-blue' }
    ],
    'Huawei Nova 13 Pro': [
        { name: 'Loden Green', hex: '#556b2f', productIdSuffix: 'loden-green' },
        { name: 'Midnight Black', hex: '#1a1a1a', productIdSuffix: 'midnight-black' }
    ],
    'Huawei Nova Y72s': [
        { name: 'Crystal Blue', hex: '#4169e1', productIdSuffix: 'crystal-blue' },
        { name: 'Black', hex: '#1a1a1a', productIdSuffix: 'black' }
    ],
    'Huawei Pura 70 Pro': [
        { name: 'Pearl White', hex: '#f8f8f8', productIdSuffix: 'pearl-white' },
        { name: 'Midnight Black', hex: '#1a1a1a', productIdSuffix: 'midnight-black' }
    ],
    'Huawei Nova Y73': [
        { name: 'Midnight Black', hex: '#1a1a1a', productIdSuffix: 'midnight-black' },
        { name: 'Blue', hex: '#4169e1', productIdSuffix: 'blue' }
    ],
    'Galaxy Z Fold7': [
        { name: 'Silver Shadow', hex: '#c0c0c0', productIdSuffix: 'silver-shadow' },
        { name: 'Blue Shadow', hex: '#4169e1', productIdSuffix: 'blue-shadow' },
        { name: 'Jet Black', hex: '#0a0a0a', productIdSuffix: 'jet-black' }
    ],
    'Galaxy Z Flip7': [
        { name: 'Jet Black', hex: '#0a0a0a', productIdSuffix: 'jet-black' },
        { name: 'Blue Shadow', hex: '#4169e1', productIdSuffix: 'blue-shadow' }
    ],
    'Galaxy Z Flip7 FE': [
        { name: 'Black', hex: '#1a1a1a', productIdSuffix: 'black' },
        { name: 'White', hex: '#f8f8f8', productIdSuffix: 'white' }
    ],
    'Galaxy S25 Ultra': [
        { name: 'Titanium Silverblue', hex: '#87ceeb', productIdSuffix: 'titanium-silverblue' },
        { name: 'Titanium Black', hex: '#1a1a1a', productIdSuffix: 'titanium-black' },
        { name: 'Titanium Gray', hex: '#808080', productIdSuffix: 'titanium-gray' },
        { name: 'Titanium Whitesilver', hex: '#f5f5f5', productIdSuffix: 'titanium-whitesilver' }
    ],
    'Galaxy S25+': [
        { name: 'Navy', hex: '#000080', productIdSuffix: 'navy' },
        { name: 'IcyBlue', hex: '#87ceeb', productIdSuffix: 'icyblue' },
        { name: 'Mint', hex: '#98fb98', productIdSuffix: 'mint' },
        { name: 'Silver Shadow', hex: '#c0c0c0', productIdSuffix: 'silvershadow' }
    ],
    'Galaxy S25': [
        { name: 'Navy', hex: '#000080', productIdSuffix: 'navy' },
        { name: 'IcyBlue', hex: '#87ceeb', productIdSuffix: 'icyblue' },
        { name: 'Mint', hex: '#98fb98', productIdSuffix: 'mint' },
        { name: 'Silver Shadow', hex: '#c0c0c0', productIdSuffix: 'silvershadow' }
    ],
    'iPhone Air': [
        { name: 'Space Black', hex: '#1a1a1a', productIdSuffix: 'space-black' },
        { name: 'Cloud White', hex: '#f5f5f5', productIdSuffix: 'cloud-white' },
        { name: 'Light Gold', hex: '#ffd700', productIdSuffix: 'light-gold' },
        { name: 'Sky Blue', hex: '#87ceeb', productIdSuffix: 'sky-blue' }
    ],
    'iPhone 17 Pro': [
        { name: 'Silver', hex: '#c0c0c0', productIdSuffix: 'silver' },
        { name: 'Cosmic Orange', hex: '#ff6b35', productIdSuffix: 'cosmic-orange' },
        { name: 'Deep Blue', hex: '#003366', productIdSuffix: 'deep-blue' }
    ],
    'iPhone 17 Pro Max': [
        { name: 'Silver', hex: '#c0c0c0', productIdSuffix: 'silver' },
        { name: 'Cosmic Orange', hex: '#ff6b35', productIdSuffix: 'cosmic-orange' },
        { name: 'Deep Blue', hex: '#003366', productIdSuffix: 'deep-blue' }
    ],
    'iPhone 17': [
        { name: 'Black', hex: '#1a1a1a', productIdSuffix: 'black' },
        { name: 'White', hex: '#ffffff', productIdSuffix: 'white' },
        { name: 'Mist Blue', hex: '#b0c4de', productIdSuffix: 'mist-blue' },
        { name: 'Sage', hex: '#9caf88', productIdSuffix: 'sage' },
        { name: 'Lavender', hex: '#e6e6fa', productIdSuffix: 'lavender' }
    ]
};

// Helper function to get colors for a specific model
function getColorsForModel(modelName) {
    return SMARTPHONE_COLORS[modelName] || [];
}

// Helper function to find color data by name
function findColorByName(colorName) {
    for (const model in SMARTPHONE_COLORS) {
        const color = SMARTPHONE_COLORS[model].find(c => c.name === colorName);
        if (color) {
            return color;
        }
    }
    return null;
}

// Helper function to get color hex by name
function getColorHex(colorName) {
    const color = findColorByName(colorName);
    return color ? color.hex : '#cccccc'; // Default gray if not found
}

// Storage data for all smartphone models
const SMARTPHONE_STORAGE = {
    'iPhone 16 Pro': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'iPhone 16 Pro Max': [
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'iPhone 16': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    'iPhone 16 Plus': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    'iPhone 15': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    'iPhone 15 Plus': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    'iPhone 15 Pro': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'iPhone 15 Pro Max': [
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'iPhone Air': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    'iPhone 17 Pro': [
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'iPhone 17 Pro Max': [
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'iPhone 17': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    'Galaxy Z Fold7': [
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'Galaxy Z Flip7': [
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' }
    ],
    'Galaxy Z Flip7 FE': [
        { size: '128GB', suffix: '128gb' },
        { size: '256GB', suffix: '256gb' }
    ],
    'Galaxy S25 Ultra': [
        { size: '256GB', suffix: '256gb' },
        { size: '512GB', suffix: '512gb' },
        { size: '1TB', suffix: '1tb' }
    ],
    'Galaxy S25+': [
        { size: '256GB', suffix: '256gb' }
    ],
    'Galaxy S25': [
        { size: '256GB', suffix: '256gb' }
    ]
};

// Helper function to get storage options for a specific model
function getStorageForModel(modelName) {
    return SMARTPHONE_STORAGE[modelName] || [];
}

