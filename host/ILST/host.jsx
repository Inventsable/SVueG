var doc = app.activeDocument;
var directory, setPath;
// Optimized has problems with compound path.
// Not sure how to handle graphics without knowing
// what kind the user will need.
// runOptimized();
function getLayerList() {
    var mirror = [];
    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if ((layer.visible) && (!layer.locked)) {
            mirror.push(i);
        }
    }
    return mirror;
}
function runOptimizedOld() {
    var layerMirror = [];
    var layerList = getLayerList();
    for (var i = 0; i < layerList.length; i++) {
        var index = layerList[i];
        var layer = doc.layers[index];
        hideAllLayersExcept(i);
        if (layer.groupItems.length) {
            // alert('hello')
            var result = findGroupsWithin(layer);
            // for (var res = 0; res < result.length; res++) {
            // var target = result[res];
            // hideAllGroupsExcept(layer, result, target);
            // alert('Should only have one item')
            // duplicateAndExpandGroup(layer, target);
            dupeAndHideOriginal();
            // }
            // restoreGroupVisibility(layer, result);
        }
    }
    restoreLayerVisibility(layerList);
}
function runOptimized() {
    var layerList = getLayerList();
    for (var i = 0; i < layerList.length; i++) {
        var index = layerList[i];
        var layer = doc.layers[index];
        // hideAllLayersExcept(i);
        if (layer.groupItems.length) {
            var result = findGroupsWithin(layer);
            dupeAllGroupsAndExpand(layer);
            var groupList = isolateGroupSelections(layer);
            expandGroupSelection(layer, groupList);
        }
    }
    restoreLayerVisibility(layerList);
}
function expandGroupSelection(layer, mirror) {
    app.selection = '';
    for (var m = 0; m < mirror.length; m++) {
        var selected = mirror[m];
        layer.groupItems[selected].selected = true;
        app.executeMenuCommand('Live Outline Stroke');
        app.executeMenuCommand('expandStyle');
        // app.executeMenuCommand('expandStyle');
        // app.executeMenuCommand('OffsetPath v22')
        // try {
        //   app.executeMenuCommand('OffsetPath v22');
        // } catch (e) { dispatchEvent('console', e) }
        app.executeMenuCommand('compoundPath');
        app.selection = '';
        alert('Tried expanding');
    }
}
function isolateGroupSelections(layer) {
    var mirror = [];
    for (var i = 0; i < layer.groupItems.length; i++) {
        var group = layer.groupItems[i];
        if (group.selected)
            mirror.push(i);
    }
    return mirror;
}
function restoreGroupVisibility(layer, list) {
    for (var i = 0; i < list.length; i++) {
        var index = list[i];
        layer.groupItems[index].hidden = false;
    }
}
function dupeAllGroupsAndExpand(layer) {
    app.executeMenuCommand('selectall');
    app.executeMenuCommand('copy');
    app.executeMenuCommand('pasteFront');
    hideUnselectedGroups(layer);
}
function hideUnselectedGroups(layer) {
    for (var i = 0; i < layer.groupItems.length; i++) {
        var group = layer.groupItems[i];
        if (!group.selected)
            group.hidden = true;
    }
}
function dupeAndHideOriginal() {
    app.executeMenuCommand('selectall');
    // app.executeMenuCommand('copy');
    // app.executeMenuCommand('pasteFront');
    // app.executeMenuCommand('Selection Hat 9');
    // try {
    //   app.executeMenuCommand('OffsetPath v22');
    // } catch (e) { dispatchEvent('console', e) }
    // app.executeMenuCommand('Selection Hat 8');
    // app.executeMenuCommand('hide');
}
function restoreLayerVisibility(list) {
    for (var i = 0; i < list.length; i++) {
        var index = list[i];
        doc.layers[index].visible = true;
    }
}
function duplicateAndExpandGroup(layer, index) {
    alert('Should be targeting ' + index);
}
function findGroupsWithin(layer) {
    var groupMirror = [];
    for (var g = 0; g < layer.groupItems.length; g++) {
        var group = layer.groupItems[g];
        if (!group.hidden) {
            groupMirror.push(g);
        }
    }
    return groupMirror;
}
function hideAllGroupsExcept(layer, result, index) {
    layer.groupItems[index].hidden = false;
    for (var i = 0; i < result.length; i++) {
        var target = result[i];
        var group = layer.groupItems[target];
        if (index !== i)
            group.hidden = true;
        else
            group.hidden = false;
    }
}
function hideAllLayersExcept(num) {
    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (num !== i)
            layer.visible = false;
    }
}
function setLocation(tempfolder) {
    setPath = tempfolder;
    var setFolder = new Folder(tempfolder);
    setFolder.create();
}
function setOptionsForSVGExport() {
    var options = new ExportOptionsWebOptimizedSVG();
    options.artboardRange = '1';
    options.coordinatePrecision = 2;
    options.fontType = SVGFontType.OUTLINEFONT;
    options.svgId = SVGIdType.SVGIDREGULAR;
    options.cssProperties = SVGCSSPropertyLocation.STYLEELEMENTS;
    return options;
}
function exportSVG() {
    var newName = setPath + "/temp.svg";
    var thisFile = new File(newName), type = ExportType.WOSVG;
    doc.exportFile(thisFile, type, setOptionsForSVGExport());
}
