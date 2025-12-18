module.exports = function (jsModule) {
    switch (jsModule) {
        case 'drivelist': return require('/Users/gregorygilds/Documents/cofounder/ide/node_modules/drivelist/build/Release/drivelist.node');
    }
    throw new Error(`unhandled module: "${jsModule}"`);
}