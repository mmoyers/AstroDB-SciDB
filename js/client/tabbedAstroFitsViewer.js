// List of remote image to load from server           
var imageFiles = [
    {
      path: 'none',
      name: '--From Server--'
    }, 
    {
      path: '/images/FITSViewerSamples/m101_dss.fits',
      name: 'm101.fits'
    },
    {
    	path: '/images/FITSViewerSamples/stsci_dss_001.fits',
    	name: 'stsci_dss_001.fits'
    }];

// Options for image stretch
var stretchOptions = ['linear', 'logarithm', 'sqrt', 'power'];

// Selection color options
var DEFAULT_MARKER_COLOR = '#ffffff';
var MARKER_COLOR = {
  red: '#ff0000',
  green: '#00ff00',
  blue: '#0000ff',
  yellow: '#dcdc00',
  unselect: '#ffffff' 
};  

var EDIT_TYPE = {ADD: 1, REMOVE: 2, ZOOM: 3, PAN: 4, SELECT: 5};
var ANNO_TYPE = {RECT: 1, CIRCLE: 2, POLY: 3, DATA: 4};
var COORD_TYPE = {PIXEL: 1, WCS: 2};

function TabState() {
    // modules
    this.annotator;
    this.astroJsFits;
    this.wcs;
    
    // Gadget state
    this.savedImagePath;
    this.showAnnotations = true;
    this.imageLoaded = false;
    this.leftMouseDown = false;
    this.prevSelectedIndex = -1;
    this.dragStart = {x: '', y: ''};
    this.selectedCoordType = COORD_TYPE.WCS;
    this.selectedEditType = EDIT_TYPE.PAN;
    this.selectedAnnoType = ANNO_TYPE.CIRCLE;
    this.polyCreateList = []
    this.selectedDataSet;
    this.selectedDataSetId = -1;
    this.fitsHeader;
    
    // Canvases and attributes
    this.display;
    this.fitsCanvas;
    this.annotatorCanvas;
    this.editCanvas;
    this.displayWidth;
    this.displayHeight;
    this.displayContext;
    this.editContext;
    this.imageDimensions;
    
}

// modules
var annotator;
var astroJsFits;
var wcs;

// Gadget state
var savedImagePath;
var showAnnotations = true;
var imageLoaded = false;
var leftMouseDown = false;
var prevSelectedIndex = -1;
var dragStart = {x: '', y: ''};
var selectedCoordType = COORD_TYPE.WCS;
var selectedEditType = EDIT_TYPE.PAN;
var selectedAnnoType = ANNO_TYPE.CIRCLE;
var polyCreateList = [];
var selectedDataSet;
var selectedDataSetId = -1;
var fitsHeader;

// Canvases and attributes
var display;

var fitsCanvas;
var annotatorCanvas;
var editCanvas;

var displayWidth;
var displayHeight;
var displayContext;
var editContext;
var imageDimensions;

// Tab stuff
var activeTabNumber = 0;
var tabStates = new Array();

gadget.saveState = function(){};
gadget.loadState = function(state){
	if (state) {
		if (state.showAnnotations != undefined)
			showAnnotations = state.showAnnotations;
		$(getElement('showAnnotations')).prop('checked', showAnnotations);
		savedImagePath = state.imagePath;
		if (state.savedDataSetId !== undefined)
			selectedDataSetId = state.savedDataSetId;
	}
}

gadget.init = function(finishedLoading){
	initTabViewer(0);
	initTabViewer(1);
	
	gadget.update = function() {};
	gadget.onNotification('dataSetChanged', dataSetChanged);
	finishedLoading();
};

var getActiveTabNumber = function() {
    var tabs = $(".tab-pane.active");
    for(var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        if (tab.dataset["tab"]) {
            return tab.dataset["tab"];
        }
    }
    
    return -1; // error no active tab
}
var getElement = function(id, tabNumber) {
    if (!tabNumber) {
        tabNumber = activeTabNumber;
    }
    
    var element = $("#tab" + tabNumber + " ." + id);
    
    if(element) {
        return element[0];
    }
    return;
}

var restoreTabState = function(tabNumber) {
    if (tabStates[tabNumber]) {
        var tabState = tabStates[tabNumber];
        
        // modules
        astroJsFits = tabState.astroJsFits;
        annotator = tabState.annotator;
        wcs = tabState.wcs;
        
        // Gadget state
        savedImagePath = tabState.savedImagePath;
        showAnnotations = tabState.showAnnotations;
        imageLoaded = tabState.imageLoaded;
        leftMouseDown = tabState.leftMouseDown;
        prevSelectedIndex = tabState.prevSelectedIndex;
        dragStart = tabState.dragStart;
        selectedCoordType = tabState.selectedCoordType;
        selectedEditType = tabState.selectedEditType;
        selectedAnnoType = tabState.selectedAnnoType;
        polyCreateList = tabState.polyCreateList;
        selectedDataSet = tabState.selectedDataSet;
        selectedDataSetId = tabState.selectedDataSetId;
        fitsHeader = tabState.fitsHeader;
        
        // Canvases and attributes
        display = tabState.display;
        fitsCanvas = tabState.fitsCanvas;
        annotatorCanvas = tabState.annotatorCanvas;
        editCanvas = tabState.editCanvas;
        displayWidth = tabState.displayWidth;
        displayHeight = tabState.displayHeight;
        displayContext = tabState.displayContext;
        editContext = tabState.editContext;
        imageDimensions = tabState.imageDimensions;
        
        $(getElement("dropbox", tabNumber)).on("dragenter", noopHandler);
        $(getElement("dropbox", tabNumber)).on("dragexit", noopHandler);
        $(getElement("dropbox", tabNumber)).on("dragover", noopHandler);
        
        $(getElement("canvasArea", tabNumber)).on("mousedown", handleMousedown);
        $(getElement("canvasArea", tabNumber)).on("mouseup", handleMouseup);
        $(getElement("canvasArea", tabNumber)).on("mousemove", handleMousemove);
        $(getElement("canvasArea", tabNumber)).on("mouseout", handleMouseout);
        
        $(getElement("display", tabNumber)).on("mousewheel", handleMousewheel);
    } else {
        console.log("Tab state not found for tab " + tabNumber);
    }
    
}

var saveTabState = function(tabNumber) {
    if (tabStates[tabNumber]) {
        var tabState = tabStates[tabNumber];
        
        // modules
        tabState.astroJsFits = astroJsFits;
        tabState.annotator = annotator;
        tabState.wcs = wcs;

        // Gadget state
        tabState.savedImagePath = savedImagePath;
        tabState.showAnnotations = showAnnotations;
        tabState.imageLoaded = imageLoaded;
        tabState.leftMouseDown = leftMouseDown
        tabState.prevSelectedIndex = prevSelectedIndex;
        tabState.dragStart = dragStart;
        tabState.selectedCoordType = selectedCoordType;
        tabState.selectedEditType = selectedEditType;
        tabState.selectedAnnoType = selectedAnnoType;
        tabState.polyCreateList = polyCreateList;
        tabState.selectedDataSet = selectedDataSet;
        tabState.selectedDataSetId = selectedDataSetId;
        tabState.fitsHeader = fitsHeader;
        
        // Canvases and attributes
        tabState.display = display;
        tabState.fitsCanvas = fitsCanvas;
        tabState.annotatorCanvas = annotatorCanvas;
        tabState.editCanvas = editCanvas;
        tabState.displayWidth = displayWidth;
        tabState.displayHeight = displayHeight;
        tabState.displayContext = displayContext;
        tabState.editContext = editContext;
        tabState.imageDimensions = imageDimensions;
        
        $(getElement("dropbox", tabNumber)).off("dragenter");
        $(getElement("dropbox", tabNumber)).off("dragexit");
        $(getElement("dropbox", tabNumber)).off("dragover");
        
        $(getElement("canvasArea", tabNumber)).off("mousedown");
        $(getElement("canvasArea", tabNumber)).off("mouseup");
        $(getElement("canvasArea", tabNumber)).off("mousemove");
        $(getElement("canvasArea", tabNumber)).off("mouseout");
        
        $(getElement("display", tabNumber)).off("mousewheel");
    } else {
        console.log("Unable to save tab state for tab " + tabNumber);
    }
}

var createNewTab = function() {
    
    
}

// Initalize the fits tab viewer, called when the gadget is initalized
var initTabViewer = function(tabNumber) {
    if (!tabStates[tabNumber]) {
        tabStates[tabNumber] = new TabState();
    }
    
    var tabState = tabStates[tabNumber];
    // Set configuration options for requirejs
    var config = {
        paths: {
            'cs': '/cs',
            'coffee-script': '/coffee-script'
        }
    };
    require(config, ['canvasAnnotator', 'cs!/astroJS/display'], function(canvasAnnotator, _astroJsFits) {
        tabState.astroJsFits = _astroJsFits;
        tabState.annotator = canvasAnnotator;
        
        tabState.showAnnotations = true;
        tabState.imageLoaded = false;
        tabState.leftMouseDown = false;
        tabState.prevSelectedIndex = -1;
        tabState.dragStart = {x: '', y: ''};
        tabState.selectedCoordType = COORD_TYPE.WCS;
        tabState.selectedEditType = EDIT_TYPE.PAN;
        tabState.selectedAnnoType = ANNO_TYPE.CIRCLE;
        tabState.polyCreateList = []
        tabState.selectedDataSetId = -1;
        
        if (activeTabNumber == tabNumber) {
            restoreTabState(tabNumber);
        }
        
        // Load an image from URL when 'Fetch' is clicked
        $(getElement('fetchURL')).click(function() {
            imageFromUrl($(getElement('imageURL')).val());
        });
        
        // Load an image from the server when one is selected from the 'remote files' dropdown box
        var imageList = $(getElement("sampleImageSelect", tabNumber));
        $.each(imageFiles, function() {
                imageList.append($("<option />").val(this.path).text(this.name));
        });
        imageList.change(function() {
                gadget.setState({ imagePath : $(this).val()});
                imageFromUrl($(this).val());
        });
        
        var stretchSelect = $(getElement("stretchSelect", tabNumber));
        $.each(stretchOptions, function() {
            stretchSelect.append($("<option />").val(this).text(this));
        });
        
        // Construct the dropdown box for the selection colors
        var colorSelect = $(getElement("selectionColorSelect", tabNumber));
        var items = ["red", "green", "blue", "yellow", "unselect"];
        $.each(items, function(index, value) {
                colorSelect.append($("<option />").val(value).text(value));
        });
  
        // Bring up an existing image if one is saved to the dashboard state
        if (savedImagePath != undefined)
            imageFromUrl(savedImagePath);
    
        console.log("Tab init " + tabNumber);
  });
}

// Create and set canvas attributes; The annotator canvas
// is used for drawing annotations; The edit canvas is used for drawing edit marks like selection boxes and
// the display canvas is the surface onto which the other canvases are displayed
var initCanvases = function() {
    display = getElement('display');
    var canvasArea = getElement('canvasArea');
    
    display.width = canvasArea.offsetWidth;
    display.height = canvasArea.offsetHeight;
    displayContext = display.getContext('2d');
    displayWidth = display.width;
    displayHeight = display.height;
    
    annotatorCanvas = document.createElement('canvas');
    annotatorCanvas.setAttribute('width', displayWidth);
    annotatorCanvas.setAttribute('height', displayHeight);
    
    editCanvas = document.createElement('canvas');
    editCanvas.setAttribute('width', displayWidth);
    editCanvas.setAttribute('height', displayHeight);
    
    editContext = editCanvas.getContext('2d');
    editContext.fillStyle = "white";
    editContext.globalAlpha = 0.5;
}

// Send a file object to the FITS parser to be displayed
var renderFile = function(file) {
	$(getElement('init')).hide();
	gadget.resize();
	$(getElement('dropLabel')).html('Loading file...');
	$(getElement('loadingBar')).show();
	
	// Need to convert the file to an arraybuffer to be read by astroJsFits
	var reader = new FileReader();
	reader.onload = function(event) {
		  var contents = event.target.result;
		  astroJsFits.init1(contents);
		  fitsHeader = astroJsFits.getHeader();
		  renderSuccess();
	};
	reader.readAsArrayBuffer(file);
}

var setImageExtremes = function(lower, upper) {
	astroJsFits.changeExtremes(lower, upper);
  draw();
}

// Executes after a FITS file is successfully loaded
var renderSuccess = function(){
    $(getElement('dropLabel')).hide();
    $(getElement('loadingBar')).hide();
    $(getElement('fitsCanvas')).show();
    $(getElement('display')).show();
    $(getElement('annoControlsContainer')).show();
    $(getElement('slidersList')).show();
    $(getElement('upperControls')).show();
    
    gadget.resize();
    imageLoaded = true;
	
	
    // Ensure that the aspect ratio of the fits canvas matches the aspect ratio of the image
    imageDimensions = {width: fitsHeader.get("NAXIS1")[1], height: fitsHeader.get("NAXIS2")[1]};
    var rat = imageDimensions.width/imageDimensions.height;
    var canvasWidth = $(getElement('dropbox')).width();
    $(getElement('dropbox')).height(canvasWidth*rat);
    
    displayWidth = $(getElement('display')).width();
    displayHeight = $(getElement('display')).height();
    initCanvases();
    astroJsFits.init2($(getElement('display')), $(getElement('display')).width(), $(getElement('display')).height());
    
    fitsCanvas = astroJsFits.getCanvas();
    annotatorCanvas.setAttribute('height', $(getElement('display')).height());
    editCanvas.setAttribute('height', $(getElement('display')).height());
    annotator.init(annotatorCanvas, astroJsFits.pixToScreen, showAnnotations);
  
    // Initalize the wcsjs module
    wcs = new WCS.Mapper(fitsHeader);
    // Send the image boundaries to the dashboard
    var topLeft = wcs.pixelToCoordinate([parseFloat(imageDimensions.width), parseFloat(imageDimensions.height)]);
    var bottomRight = wcs.pixelToCoordinate([0, 0]);
    var curBounds = { 
                    topLeft: {ra: topLeft.ra, dec: topLeft.dec },
                    bottomRight: {ra: bottomRight.ra, dec: bottomRight.dec}
    };
    
    if (curBounds.topLeft.ra > curBounds.bottomRight.ra) {
        var a = curBounds.topLeft.ra;
        curBounds.topLeft.ra = curBounds.bottomRight.ra;
        curBounds.bottomRight.ra = a;
    }
    if (curBounds.topLeft.dec < curBounds.bottomRight.dec) {
        var a = curBounds.topLeft.dec;
        curBounds.topLeft.dec = curBounds.bottomRight.dec;
        curBounds.bottomRight.dec = a;
    }
    
    gadget.notify('viewBoundsChanged', {'bounds': curBounds, 'source': 'fitsViewer'});
    
    // Load up a dataset if one was saved
    if (selectedDataSetId != -1)
        addDataSetPoints();
    
    // Add the scaling slider
    var extremes = astroJsFits.getImageExtremes();
    $(getElement("scalingSlider")).slider({
        range: true,
        min: extremes.minimum,
        max: extremes.maximum,
        values: [extremes.minimum, extremes.maximum],
        slide: function(event, ui) {
            var lo = parseInt($(getElement("scalingSlider")).slider("values", 0));
            var hi = parseInt($(getElement("scalingSlider")).slider("values", 1));
            setImageExtremes(lo, hi);
        }
    });
    gadget.resize();
    draw();
};

// Draw the fits image, annotations, and edit marks
var draw = function() {
    var $dropbox = $(getElement('dropbox'));
    
	annotator.draw();
	displayContext.clearRect(0, 0, displayWidth, $dropbox.height());
	displayContext.drawImage(fitsCanvas, 0, 0, displayWidth, $dropbox.height(), 0, 0, displayWidth, $dropbox.height());
	displayContext.drawImage(annotatorCanvas, 0, 0, displayWidth, $dropbox.height(), 0, 0, displayWidth, $dropbox.height());
	displayContext.drawImage(editCanvas, 0, 0, displayWidth, $dropbox.height(), 0, 0, displayWidth, $dropbox.height());
}

// Used to prevent something from happening when an event fires
var noopHandler = function(evt) {
	evt.stopPropagation();
	evt.preventDefault();
}

// Select all annotations between two pixel coordinates on the image and mark those
// annotations in the global dataset
var selectAnnotations = function(start, end) {
	var startNative = astroJsFits.cursorToPix(start.x, start.y);
	var endNative = astroJsFits.cursorToPix(end.x, end.y);

	var selectEl = getElement("selectionColorSelect");
	var colorName = selectEl.options[selectEl.selectedIndex].value;
	var idsToColor = annotator.selectAnnotations(startNative, endNative, MARKER_COLOR[colorName]);
	
	if (selectedDataSet == undefined)
		return;
	setTimeout(function() { selectedDataSet.setRecords({'color': colorName}, idsToColor); }, .1);
}

// If a dataset is selected, sync the color of the annotations up with the 
// color of the points in the dataset
var updateSelectedPoints = function() {
	if (selectedDataSet == undefined) {
		selectedDataSetId = -1;
		annotator.removeAllAnnotations();
		return;
	}
 	for (var i = 0; i < selectedDataSet.length(); i++) {
 		var color = MARKER_COLOR[selectedDataSet.getRecord(i).color];
 		var id = selectedDataSet.getRecord(i).id;
 		if (color != undefined)
 			annotator.colorAnnotation(id, color);
 	}
}

// Repopulate the data selection dropdown and update all of the displayed points
// when the global dataset changes
var dataSetChanged = function() {
	
	populateDataSetSelect();
	
	if (!imageLoaded)
		return;
	
	updateSelectedPoints();
	draw();
}

var stretchSelectChange = function() {
	var el = getElement("stretchSelect");
	var newStretch = el.options[el.selectedIndex].value;
	astroJsFits.changeStretch(newStretch);
}

var dataSetSelectChange = function() {
	var el = getElement("datasetNameSelect");
	selectedDataSetId = parseInt(el.options[el.selectedIndex].value);
}

// Gets all of the dataset names and puts them in the import dataset dropdown
var populateDataSetSelect = function() {
	var el = getElement("datasetNameSelect");
	var items = gadget.dashboard.getDataSetList();
	el.options.length = 0;
	for (i in items) {
		var option = document.createElement("OPTION");
		option.text = items[i].text;
		option.value = items[i].id;
		el.options.add(option);
	}
	selectedDataSet = gadget.dashboard.getDataSet(selectedDataSetId);
}

// Event handlers for the canvases

var handleMousedown = function(e) {
	if (!imageLoaded)
		return;
		
	// Send event to fits image canvas
	if (selectedEditType == EDIT_TYPE.PAN) {
		var evObj = document.createEvent('MouseEvents');
		evObj.initMouseEvent( 'mousedown', false, true, window, 1, e.screenX, e.screenY, e.clientX, e.clientY, false, false, true, false, 0, null );
		fitsCanvas.dispatchEvent(evObj);
	}

	leftMouseDown = true;
	if (selectedEditType == EDIT_TYPE.ADD || selectedEditType == EDIT_TYPE.SELECT) {
		dragStart = {x: e.offsetX, y: e.offsetY};
	}
	annotator.handleMousedown(e.originalEvent);
	draw();
}

var finishDrag = function(e) {
	if (selectedEditType == EDIT_TYPE.ADD) {
		editContext.clearRect(0,0,$(getElement('dropbox')).width(),$(getElement('dropbox')).height());
		var start = astroJsFits.cursorToPix(dragStart.x, dragStart.y);
		var end = astroJsFits.cursorToPix(e.offsetX, e.offsetY);
		if (selectedAnnoType == ANNO_TYPE.RECT) {
			annotator.addRectRegion({'xPos':start.x, 'yPos': start.y, 
													 		 'width': end.x-start.x, 'height': end.y-start.y, 
															 'label': "rect"});
 			getElement("annoSelect").add(new Option("rect", "0"), null);
		}
		else if (selectedAnnoType == ANNO_TYPE.CIRCLE) {
			annotator.addCircleRegion({'xPos': start.x, 'yPos': start.y, 'radius': Math.abs(end.x-start.x), label: ["another"]});
			getElement("annoSelect").add(new Option("circle", "0"), null);
		}
	}
	if (selectedEditType == EDIT_TYPE.SELECT) {
		editContext.clearRect(0,0,$(getElement('dropbox')).width(),$(getElement('dropbox')).height());
		var start = {x: dragStart.x, y: dragStart.y};
		var end = {x: e.offsetX, y: e.offsetY};
		selectAnnotations(start, end);
	}
	annotator.handleMouseup(e.originalEvent);
	draw();
}

var handleMouseup = function(e) {
	if (!imageLoaded)
		return;
	
	// Send event to fits image canvas
	var evObj = document.createEvent('MouseEvents');
	evObj.initMouseEvent( 'mouseup', false, true, window, 1, e.screenX, e.screenY, e.clientX, e.clientY, false, false, true, false, 0, null );
	// Only notify the fits canvas of the mouse event if we are in pan mode
	if (selectedEditType == EDIT_TYPE.PAN) fitsCanvas.dispatchEvent(evObj);

	leftMouseDown = false;
	finishDrag(e);
}

var handleMousewheel = function(e) {
	if (!imageLoaded)
		return;
	e.preventDefault();
	// Send event to fits image canvas
	var evObj = document.createEvent('MouseEvents');
	evObj.initMouseEvent( 'mousewheel', false, true, window, 1, e.originalEvent.screenX-22, e.originalEvent.screenY-22, e.originalEvent.clientX-22, e.originalEvent.clientY-22, false, false, true, false, 0, null );
	evObj.wheelDelta = e.originalEvent.wheelDelta;
	fitsCanvas.dispatchEvent(evObj);
	//annotator.handleMousewheel(e.originalEvent);
	draw();
}

var handleMouseout = function(e) {
	leftMouseDown = false;
	if (!imageLoaded)
		return;
	// Send event to fits image canvas
	var evObj = document.createEvent('MouseEvents');
	evObj.initMouseEvent( 'mouseout', false, true, window, 1, e.screenX, e.screenY, e.clientX, e.clientY, false, false, true, false, 0, null );
	fitsCanvas.dispatchEvent(evObj);
	if (leftMouseDown) finishDrag(e);
}

var handleMousemove = function(e) {
	if (!imageLoaded)
		return;
		
	// Update pixel readout
	var nativeMouse = astroJsFits.cursorToPix(e.offsetX, e.offsetY);
	nativeMouse.y = fitsHeader.get("NAXIS2")[1] - nativeMouse.y;
	getElement("xPix").innerHTML = parseInt(nativeMouse.x);
	getElement("yPix").innerHTML = parseInt(nativeMouse.y);
	var wcsMouse = wcs.pixelToCoordinate([nativeMouse.x, nativeMouse.y]);
	getElement("alpha").innerHTML = wcsMouse.ra.toFixed(5);
	getElement("delta").innerHTML = wcsMouse.dec.toFixed(5);
	getElement("pixValue").innerHTML = parseInt(astroJsFits.getPixelValue(nativeMouse.x, nativeMouse.y));
	
	// Send event to fits image canvas
	var evObj = document.createEvent('MouseEvents');
	evObj.initMouseEvent( 'mousemove', false, true, window, 1, e.screenX, e.screenY, e.clientX, e.clientY, false, false, true, false, 0, null );
	fitsCanvas.dispatchEvent(evObj);

	if (leftMouseDown) {
		if (selectedEditType == EDIT_TYPE.ADD || selectedEditType == EDIT_TYPE.SELECT) {
			editContext.clearRect(0,0,$(getElement('dropbox')).width(),$(getElement('dropbox')).height());
			editContext.fillStyle = "#ffffff";
			editContext.globalAlpha = 0.3;
			if (selectedAnnoType == ANNO_TYPE.RECT || selectedEditType == EDIT_TYPE.SELECT)
				editContext.fillRect(dragStart.x, dragStart.y, e.offsetX-dragStart.x, e.offsetY-dragStart.y);
			else if (selectedAnnoType == ANNO_TYPE.CIRCLE && selectedEditType != EDIT_TYPE.SELECT) {
				editContext.beginPath();
				editContext.arc(dragStart.x	, dragStart.y, Math.abs(e.offsetX-dragStart.x), 0, 2 * Math.PI, false);
				editContext.fill();
			}
		}
		else if (selectedEditType == EDIT_TYPE.PAN)
			annotator.handleMousemovePan(e);
	}
	else
		annotator.handleMousemove(e);
	draw();
}

// Makes an AJAX request through the server and sends the result to the FITS parser to be displayed
var imageFromUrl = function(path) {
	$(getElement('init')).hide();
	gadget.resize();
	if (path == "None")
		return;
    
	// Send an http response to the FITS parser to be displayed
	var renderImage = function(response) {
		// convert string object into a binary object
		var byteArray = new Uint8Array(response.length);
		for (var i = 0; i < response.length; i++) {
				byteArray[i] = response.charCodeAt(i) & 0xff;
		}
		
		astroJsFits.init1(byteArray.buffer);
		fitsHeader = astroJsFits.getHeader();
		renderSuccess();
	}

	$(getElement('dropLabel')).html('Loading file...');
	$(getElement('loadingBar')).show();

	$.ajax({
		'url': '/xhrProxy/' + encodeURIComponent(path),
		success: renderImage 
	});
}

// Called when the user clicks 'unload image'
// Sets the gadget back to its initial blank state
var clickUnloadImage = function() {
	$(getElement("dropLabel")).show(); 
	$(getElement("dropLabel")).html('No image loaded');
    $(getElement("loadingBar")).hide();
    $(getElement('sampleImageSelect'))[0].selectedIndex = 0;
    $(getElement("init")).show();
    $(getElement("upperControls")).hide();
    $(getElement("annoControlsContainer")).hide();
    $(getElement("slidersList")).hide();
    
    fitsCanvas.style.display = 'none';
    display.style.display = 'none';
    gadget.resize();
    
    gadget.setState({ annoObject : undefined});
    gadget.setState({ imagePath : undefined});
    imageLoaded = false;
}

var clickRadioAdd = function() {
	getElement("removeControls").style.display = "none";
	getElement("addControls").style.display = "block";
	getElement("polyControls").style.display = "none";
	getElement("selectControls").style.display = "none";
	gadget.resize();
	selectedEditType = EDIT_TYPE.ADD;
	
	switch (selectedAnnoType) {
		case ANNO_TYPE.CIRCLE:
			getElement("circleControls").style.display = "block";
			break;
		case ANNO_TYPE.RECT:
			getElement("rectControls").style.display = "block";
			break;
		case ANNO_TYPE.POLY:
			getElement("polyControls").style.display = "block";
			break;
	}
}

var clickRadioCircle = function() {
	getElement("rectControls").style.display = "none";
	getElement("circleControls").style.display = "block";
	getElement("polyControls").style.display = "none";
	getElement("datasetControls").style.display = "none";
	gadget.resize();
	selectedAnnoType = ANNO_TYPE.CIRCLE;
}

var clickRadioRect = function() {
	getElement("rectControls").style.display = "block";
	getElement("circleControls").style.display = "none";
	getElement("polyControls").style.display = "none";
	getElement("datasetControls").style.display = "none";
	gadget.resize();
	selectedAnnoType = ANNO_TYPE.RECT;
}

var clickRadioPoly = function() {
	getElement("rectControls").style.display = "none";
	getElement("circleControls").style.display = "none";
	getElement("polyControls").style.display = "block";
	getElement("datasetControls").style.display = "none";
	gadget.resize();
	selectedAnnoType = ANNO_TYPE.POLY;
}

var clickRadioDataset = function() {
	getElement("rectControls").style.display = "none";
	getElement("circleControls").style.display = "none";
	getElement("polyControls").style.display = "none";
	getElement("datasetControls").style.display = "block";
	selectedAnnoType = ANNO_TYPE.DATA;
}

var clickRadioPix = function() {
	selectedCoordType = COORD_TYPE.PIX;
}

var clickRadioWCS = function() {
	selectedCoordType = COORD_TYPE.WCS;
}

var clickRemovalSelection = function() {
	var selectedIndex = getElement("annoSelect").selectedIndex+1;
	prevSelectedIndex = selectedIndex;
}

var clickShowAnnotations = function() {
	if (showAnnotations) {
		annotator.hideAnnotations();
		showAnnotations = false;
		gadget.setState({ showAnnotations : false});
		draw();
	}
	else {
		annotator.showAnnotations();
		showAnnotations = true;
		gadget.setState({ showAnnotations : true});
		draw();
	}
}

var addPolyPoint = function() {
	var coordA = getElement("polyPosA").value;
	var coordB = getElement("polyPosB").value;
	var str = "(" + coordA + ", " + coordB + ")";
	getElement("polyPointsSelect").add(new Option(str, "0"), null);
	polyCreateList.push([coordA, coordB]);
}

var removeSelectedPolyPoint = function() {
	var list = getElement("polyPointsSelect");
	var selectedId = list.selectedIndex;
	if (selectedId != -1) {
		list.remove(selectedId);
	}
	polyCreateList.splice(selectedId,1);
}

var removeAnnotations = function() {
	var numAnnos = getElement("annoSelect").length;
	var list = getElement("annoSelect");
	for (var i = 0; i < numAnnos; i++) {
		annotator.removeAnnotation(0);
		list.remove(0);
		draw();
	}
}

var removeSelectedAnnotation = function () {
	var list = getElement("annoSelect");
	var selectedId = list.selectedIndex;
	if (selectedId != -1) {
		annotator.removeAnnotation(selectedId);
		list.remove(selectedId);
		draw();
	}
}

var createCircleAnno = function() {
	var coordA = getElement('circlePosA').value;
	var coordB = getElement('circlePosB').value;
	var radius = getElement('circleRadius').value;
	var label = [getElement('circleLabel').value];
	
	var circlePos;
	if (selectedCoordType == COORD_TYPE.WCS)
		circlePos = wcs.coordinateToPixel(coordA,coordB);
	else
		circlePos = {"x": parseFloat(coordA), "y": parseFloat(coordB)};
	annotator.addCircleRegion({'xPos': circlePos.x, 'yPos': imageDimensions.height-circlePos.y, 'radius': parseFloat(radius), label: label});
	getElement("annoSelect").add(new Option(label, "0"), null);
	draw();
}

var createRectAnno = function() {
	var corner1A = getElement('rectPosA').value;
	var corner1B = getElement('rectPosB').value;
	var width = getElement('rectWidth').value;
	var height = getElement('rectHeight').value;
	var label = [getElement('rectLabel').value];

	var corner1;
	var corner2;
	if (selectedCoordType == COORD_TYPE.WCS) {
		corner1 = wcs.coordinateToPixel(corner1A,corner1B);
		corner2 = wcs.coordinateToPixel(parseFloat(corner1A)-parseFloat(width),parseFloat(corner1B)-parseFloat(height));
	}
	else {
		corner1 = {"x": parseFloat(corner1A), "y": parseFloat(corner1B)};
		corner2 = {"x": parseFloat(corner1A)+parseFloat(width), "y": parseFloat(corner1B)+parseFloat(height)};
	}
	annotator.addRectRegion({'xPos': corner1.x, 'yPos': imageDimensions.height-corner1.y, 
  												 'width': -(corner2.x-corner1.x), 'height': -(corner2.y-corner1.y), 
  												 'label': label});
 	getElement("annoSelect").add(new Option(label, "0"), null);
 	draw();
}

var createPolyAnno = function() {
	var list = getElement("polyPointsSelect");
	var polyPoints = [];
	for (i in polyCreateList) {
		var point = {"x": polyCreateList[i][0], "y": polyCreateList[i][1]};
		list.remove(0);
		
		if (selectedCoordType == COORD_TYPE.WCS)
			point = wcs.coordinateToPixel(polyCreateList[i][0], polyCreateList[i][1])
		polyPoints.push([point.x, imageDimensions.height-point.y]);
	}
	
	polyCreateList = [];
	var label = [getElement("polyLabel").value];
	
	annotator.addPolyRegion({'vertices': polyPoints, 'label': label, 'labelXPos': 0, 'labelYPos': 0});
	getElement("annoSelect").add(new Option("polygon", "0"), null);
	draw();
}

var addDataSetPoints = function() {
	if (gadget.dashboard.getDataSetList()[0] == undefined)
		return;
	if (selectedDataSetId == -1 || selectedDataSetId == undefined)
		selectedDataSetId = gadget.dashboard.getDataSetList()[0].id;
	selectedDataSet = gadget.dashboard.getDataSet(selectedDataSetId);
	removeAnnotations();
	var coordA;
	var coordB;
	for (var i = 0; i < selectedDataSet.length(); i++) {
    coordA = selectedDataSet.getRecord(i)["ra"]; 
    coordA = /\./.test(coordA)? parseFloat(coordA) : coordA;
    coordB = selectedDataSet.getRecord(i)["dec"];
    coordB = /\./.test(coordB)? parseFloat(coordB) : coordB;
    
    var label = [("ra: " + coordA),("dec: " + coordB)]
    
    if (coordA !== NaN && coordB !== NaN) {
    	var circlePos = wcs.coordinateToPixel(coordA, coordB);
      annotator.addCircleRegion({'id': selectedDataSet.getRecord(i)["id"],
                    						 'xPos': circlePos.x, 
												         'yPos': fitsHeader.get("NAXIS2")[1]-circlePos.y,
												         'color': MARKER_COLOR[selectedDataSet.getRecord(i).color],
												         'radius': 5,
												         'label': label});
     getElement("annoSelect").add(new Option("circle", "0"), null);
    }
  }
  gadget.setState({savedDataSetId: selectedDataSetId});
  draw();
}

//window.onload = function() {
$(document).ready(function() {
    $( "#tabs" ).tabs(
        {
            beforeActivate: function(event, ui) {
                gadget.resize();
                saveTabState(activeTabNumber);
                activeTabNumber = ui.newTab.index();
                restoreTabState(activeTabNumber);
              
                console.log("Tab Switch to tab " + activeTabNumber);
            }
        }
    );
    gadget.resize();
}); // End of onload

