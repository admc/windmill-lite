wminit = function(){
  var o = document.createElement('div');
  o.id = 'wmUI';
  o.style.width = "500px";
  o.style.height = "125px";
  o.style.position = "absolute";
  o.style.top = "0px";
  o.style.left = "0px";
  o.style.background = "#696969";
  o.style.border = "2px solid #aaa";
  o.style.zIndex = "9999999";
  o.style.display = "none";
  o.style.opacity = "0.9";
  o.style.filter = "alpha(opacity=90)";
  document.body.appendChild(o);
  
  var d = document.createElement('div');
  d.id = 'wmOut';
  d.style.top = "5px";
  d.style.left = "5px";
  d.style.width = "200px";
  d.style.height = "80px";
  d.style.position = "relative";
  d.style.overflow = "auto";
  d.style.background = "lightblue";
  d.style.border = "1px solid #aaa";
  d.style.font = "11px arial";
  d.style.padding = "4px";
  o.appendChild(d);
  
  var i = document.createElement('textarea');
  i.id = 'wmIn';
  i.cols = "32";
  i.rows = "5";
  i.style.left = "220px";
  i.style.top = "5px";
  i.style.position = "absolute";
  i.onkeypress = function(e){
    //if the user hits ~, move the focus back to the div
    if (e.charCode == 96){
      this.blur();
    }
  };
  o.appendChild(i);
  
  var b = document.createElement('button');
  b.innerHTML = "Run Test";
  b.style.left = "420px";
  b.style.top = "95px";
  b.style.position = "absolute";
  b.onclick = function() { 
    var code = document.getElementById('wmIn').value;
    
    //test functions to run
    var fa = [];
    //get the test functions
    re = /(^var\s+|^function\s+)(test_[^\s(]+)/gm;
    while (m = re.exec(code)) {
      fa.push(m[2]);
    }
    //eval the code
    try {
      eval(code);
    } catch(err){
      alert('Your code is the suck, ' + err);
    }
    //run the functions
    for (var f = 0; f < fa.length; f++){
      wm.write(fa[f], null);
      eval(fa[f]+'()');
    }
  };
  o.appendChild(b);
  
  var l = document.createElement('div');
  l.style.fontColor = "darkgray";
  l.innerHTML = "<p><i>Windmill Lite</i>";
  o.appendChild(l);
  
};

window.document.onkeypress = function(e) {
  var o = document.getElementById('wmUI');
  if ((e.altKey == true) && (e.charCode == 8224)){
    
    if (o.style.display == "block"){
      o.style.display = "none";
      return;
    }
    
    o.style.display = "block";
  }
};

//if the page is already loaded, init
//else init on window load
(function(){
  try {
    var pagebdy = window.document.body;
    wminit();
  } 
  catch(err){
    window.onload = wminit;
  }
})();

//define wm lite namespace
wm = new function() {
  this.win = window;
  this.asleep = false;
  
  //commands in line to run
  this.stack = [];
  
  //error storage
  this.errorArr = [];
  this.err = function(s){
    wm.errorArr.push(s);
  };
  
  //Execute the stack in order
  this.doStack = function(){
    while (this.stack.length != 0){
      if (this.asleep){ return; }
      var act = this.stack.shift();
      
      try {
        if (act.meth.indexOf('.') == -1){
          this.ctrl[act.meth](act.p);
        }
        else {
          var ns = act.meth.split('.');
          this.ctrl[ns[0]][ns[1]](act.p);
        }
        wm.write('Starting: <b>' + act.meth + '</b>', true);
      }
      catch(err) { wm.write(err, false); }
    }
  };
  
  //Run a single command
  this.user = function(meth, p){
    if (this.asleep){
      this.stack.push({'meth':meth,'p':p});
      return;
    }
    if (this.stack.length != 0){
      this.doStack();
    }
    try {
      if (meth.indexOf('.') == -1){
        this.ctrl[meth](p);
      }
      else {
        var ns = meth.split('.');
        this.ctrl[ns[0]][ns[1]](p);
      }
      wm.write('Starting: <b>' + meth + '</b>', true)
    } catch(err) { wm.write(err, false); }
  };
  
  //write output
  this.write = function(s, bool){
    var o = document.getElementById('wmOut');
    if (o){
      //suite names
      if (bool == null){
        o.innerHTML += '<b>Running: '+ s + '</b><br>';
      }
      else {
        //pass
        o.innerHTML += s;
        if (bool){
          o.innerHTML += ' -- <font color="darkgreen"><b>PASS</b></font>'+'<br>';
        }
        //fail
        else {
          o.innerHTML += ' -- <font color="darkred"><b>FAIL</b></font>'+'<br>';
        } 
      }
      o.scrollTop = o.scrollHeight;
    }
  };
  
};

wm.ctrl = new function(){
  this.asserts = {};
  this.waits = {};
}

wm.ctrl.waits.sleep = function(p) {
  wm.asleep = true;
  setTimeout('wm.asleep = false; wm.doStack();', p.ms);
}

wm.ctrl.waits.forElement = function(p){
  wm.asleep = true;
  
  //if a timeout is set make them global
  if (p.timeout){
    window.searchTimeout = p.timeout;
  }
  else {
    window.searchTimeout = 8000;
  }
  window.incTimeout = 0;
  
  //set the node to be accessible
  window.node = p;
  
  //define the search method
  window.search = function(){
    var element = null;
    try {
      element = elementslib.lookup(window.node);
    } catch(err){ var error = err;}
    
    //if we found the element
    if (element != null){
      clearInterval(window.searchIntv);
      wm.asleep = false;
      wm.doStack(); 
    }
    else {
      window.incTimeout += 100;
      //if it is now timed out
      if (window.incTimeout >= window.searchTimeout){
        clearInterval(window.searchIntv);
        wm.write(error, false); 
        wm.asleep = false;
        wm.doStack();
      }
    }
  }
  window.searchIntv = setInterval('window.search()', 100);
}

/**
* Navigates the Windmill testing applicatoin to the provided url
* @param {Object} p The JavaScript object used to provide the necessary options
*/
wm.ctrl.open = function (p) {
  wm.win.location = p.url;
};

/**
* Select an option from a Select element by either value or innerHTML
* @param {Object} p The JavaScript providing: Locator, option or value
* @throws Exception Unable to select the specified option.
*/
wm.ctrl.select = function (p) {
  //lookup
  var element = elementslib.lookup(p);
  
  //if the index selector was used, select by index
  if (p.index){
    element.options[p.index].selected = true;
    return true;
  }
      
  //Sometimes we can't directly access these at this point, not sure why
  try {
    if (element.options[element.options.selectedIndex].text == p['option']){
      return true;
    }
  } catch(err){ wm.err(err)}
  try {  
    if (element.options[element.options.selectedIndex].value == p['val']){
      return true;
    }
  } catch(err){ wm.err(err)}
  
  events.triggerEvent(element, 'focus', false);
  var optionToSelect = null;
  for (opt = 0; opt < element.options.length; opt++){
    try {
      var el = element.options[opt];
      if (p.option != undefined){
        if(el.innerHTML.indexOf(p.option) != -1){
          if (el.selected && el.options[opt] == optionToSelect){
            continue;
          }
          optionToSelect = el;
          optionToSelect.selected = true;
          events.triggerEvent(element, 'change', true);
          break;
        }
      }
      else {
         if(el.value.indexOf(p.val) != -1){
            if (el.selected && el.options[opt] == optionToSelect){
              continue;
            }
            optionToSelect = el;
            optionToSelect.selected = true;
            events.triggerEvent(element, 'change', true);
            break;
          }
      }
    }
    catch(err){}
  }
  if (optionToSelect == null){
    throw "Unable to select the specified option.";
  }
};

wm.ctrl.mouseDown = function (p) {
    var mupElement = elementslib.lookup(p);
    if (mupElement == null){
      mupElement = wm.win.document.body;
    }
    if (/MSIE[\/\s](\d+\.\d+)/.test(navigator.userAgent)){
        var box = mupElement.getBoundingClientRect(); 
        var left = box.left;
        var top = box.top + 2;
        events.triggerMouseEvent(mupElement, 'mousedown', true, left, top);  
    }
    else { events.triggerMouseEvent(mupElement, 'mousedown', true);  }
};

/**
* Fire a mousemove event ending at a specified set of coordinates
* @param {Object} p The JavaScript object providing: coords
*/
wm.ctrl.mouseMoveTo = function (p) {
  var webApp = wm.win;
  var coords = p.coords.split(',');
  coords[0] = coords[0].replace('(','');
  coords[1] = coords[1].replace(')','');
  
  events.triggerMouseEvent(webApp.document.body, 'mousemove', true, coords[0], coords[1]);
};

/**
* Fire the mouseup event against a specified node, defaulting to document.body
* @param {Object} p The JavaScript object providing: Locator
*/
wm.ctrl.mouseUp = function (p){
 try {
   var mupElement = elementslib.lookup(p);
 } catch(err){}
 
 if (mupElement == null){
   mupElement = wm.win.document.body;
 }
 if (/MSIE[\/\s](\d+\.\d+)/.test(navigator.userAgent)){
   var box = mupElement.getBoundingClientRect(); 
   var left = box.left;
   var top = box.top + 2;
   events.triggerMouseEvent(mupElement, 'mouseup', true, left, top);
 }
 else{
   events.triggerMouseEvent(mupElement, 'mouseup', true);
 }
};

/**
* Fire the mouseover event against a specified DOM element
* @param {Object} p The JavaScript object providing: Locator
*/  
wm.ctrl.mouseOver = function (p){
 var mdnElement = elementslib.lookup(p);
 events.triggerMouseEvent(mdnElement, 'mouseover', true);
};

/**
* Fire the mouseout event against a specified DOM element
* @param {Object} p The JavaScript object providing: Locator
*/
wm.ctrl.mouseOut = function (p){
 var mdnElement = elementslib.lookup(p);
 events.triggerMouseEvent(mdnElement, 'mouseout', true);
};

/**
* Fire keypress event
* @param
*/
wm.ctrl.keyPress = function(p){
 try {
   var element = elementslib.lookup(p);
 } catch(err){ var element = wm.win.document.body; }

 p.options = p.options.replace(/ /g, "");

 var opts = p.options.split(",");
 events.triggerEvent(element, 'focus', false);
 //element, eventType, keySequence, canBubble, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown
 events.triggerKeyEvent(element, "keypress", opts[0], eval(opts[1]), eval(opts[2]), eval(opts[3]), eval(opts[4]), eval(opts[5]));
};

/**
* Fire keydown event
* @param
*/
wm.ctrl.keyDown = function(p){
 try {
   var element = elementslib.lookup(p);
 } catch(err){ var element = wm.win.document.body; }

 p.options = p.options.replace(/ /g, "");

 var opts = p.options.split(",");
 events.triggerEvent(element, 'focus', false);
 //element, eventType, keySequence, canBubble, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown
 events.triggerKeyEvent(element, "keyDown", opts[0], eval(opts[1]), eval(opts[2]), eval(opts[3]), eval(opts[4]), eval(opts[5]));
};

/**
* Fire keydown event
* @param
*/
wm.ctrl.keyUp = function(p){
 try {
   var element = elementslib.lookup(p);
 } catch(err){ var element = wm.win.document.body; }

 p.options = p.options.replace(/ /g, "");

 var opts = p.options.split(",");
 events.triggerEvent(element, 'focus', false);
 //element, eventType, keySequence, canBubble, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown
 events.triggerKeyEvent(element, "keyUp", opts[0], eval(opts[1]), eval(opts[2]), eval(opts[3]), eval(opts[4]), eval(opts[5]));
};

/**
* Trigger the back function in the Windmill Testing Application Window
*/
wm.ctrl.goBack = function(p){
 wm.win.history.back();
}

/**
* Trigger the forward function in the Windmill Testing Application Window
*/
wm.ctrl.goForward = function(p){
 wm.win.history.forward();
}

/**
* Trigger the refresh function in the Windmill Testing Application Window
*/
wm.ctrl.refresh = function(p){
 wm.win.location.reload(true);
}

/**
* Trigger the scroll function in the Windmill Testing Application Window
* @param {Object} p The JavaScript object providing: coords
*/
wm.ctrl.scroll = function(p){
 var d = p.coords;
 d = d.replace('(','');
 d = d.replace(')','');
 var cArr = d.split(',');
 wm.win.scrollTo(cArr[0],cArr[1]);
}


//Firefox Specific Controller Methods
if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){
  
  wm.browser = "Firefox";
  
  //Click function for Mozilla with Chrome
  wm.ctrl.click = function(p){
    var element = elementslib.lookup(p);
    events.triggerEvent(element, 'focus', false);

    // Add an event listener that detects if the default action has been prevented.
    // (This is caused by a javascript onclick handler returning false)
    // we capture the whole event, rather than the getPreventDefault() state at the time,
    // because we need to let the entire event bubbling and capturing to go through
    // before making a decision on whether we should force the href
    var savedEvent = null;

    element.addEventListener('click', function(evt) {
        savedEvent = evt;
    }, false);

    // Trigger the event.
    events.triggerMouseEvent(element, 'mousedown', true);
    events.triggerMouseEvent(element, 'mouseup', true);
    events.triggerMouseEvent(element, 'click', true);
    try{
      // Perform the link action if preventDefault was set.
      // In chrome URL, the link action is already executed by triggerMouseEvent.
      if (!browser.isChrome && savedEvent != null && !savedEvent.getPreventDefault()) {
          if (element.href) {
              wm.ctrl.open({"url": element.href, 'reset':false});
          } 
          else {
              var itrElement = element;
              while (itrElement != null) {
                if (itrElement.href) {
                  wm.ctrl.open({"url": itrElement.href, 'reset':false});
                  break;
                }
                itrElement = itrElement.parentNode;
              }
          }
      }
    }
    catch(err){}
  };

  //there is a problem with checking via click in safari
  wm.ctrl.check = function(p){
    return wm.ctrl.click(p);    
  };

  //Radio buttons are even WIERDER in safari, not breaking in FF
  wm.ctrl.radio = function(p){
    return wm.ctrl.click(p);      
  };

  //Double click for Mozilla
  wm.ctrl.doubleClick = function(p) {
   //Look up the dom element, return false if its not there so we can report failure
   var element = elementslib.lookup(p);
   events.triggerEvent(element, 'focus', false);
   events.triggerMouseEvent(element, 'dblclick', true);
   events.triggerEvent(element, 'blur', false);
  };

  //Type Function
  wm.ctrl.type = function (p){
   var element = elementslib.lookup(p);

   //clear the box
   element.value = '';
   //Get the focus on to the item to be typed in, or selected
   events.triggerEvent(element, 'focus', false);
   events.triggerEvent(element, 'select', true);

   //Make sure text fits in the textbox
   var maxLengthAttr = element.getAttribute("maxLength");
   var actualValue = p.text;
   var stringValue = p.text;

   if (maxLengthAttr != null) {
     var maxLength = parseInt(maxLengthAttr);
     if (stringValue.length > maxLength) {
       //truncate it to fit
       actualValue = stringValue.substr(0, maxLength);
     }
   }

   var s = actualValue;
   for (var c = 0; c < s.length; c++){
     events.triggerKeyEvent(element, 'keydown', s.charAt(c), true, false,false, false,false);
     events.triggerKeyEvent(element, 'keypress', s.charAt(c), true, false,false, false,false); 
     if (s.charAt(c) == "."){
       element.value += s.charAt(c);
     }
     events.triggerKeyEvent(element, 'keyup', s.charAt(c), true, false,false, false,false);
   }
   //if for some reason the key events don't do the typing
   if (element.value != s){
     element.value = s;
   }

   // DGF this used to be skipped in chrome URLs, but no longer.  Is xpcnativewrappers to blame?
   //Another wierd chrome thing?
   events.triggerEvent(element, 'change', true);
 };
};

//Load Safari Specific Controller Methods
if (/Safari[\/\s](\d+\.\d+)/.test(navigator.userAgent)){
  wm.browser = "Safari";
  //there is a problem with checking via click in safari
  wm.ctrl.check = function(p){
    return wm.ctrl.click(p);    
  };

  //Radio buttons are even WIERDER in safari
  wm.ctrl.radio = function(p){
    var element = elementslib.lookup(p);
    element.checked = true;
  };

  //Safari Click function
  wm.ctrl.click = function(p){
    var element = elementslib.lookup(p);
    events.triggerEvent(element, 'focus', false);

      // For form element it is simple.
      if (element['click']) {
        element['click']();
      }
      else{
        // And since the DOM order that these actually happen is as follows when a user clicks, we replicate.
        if (element.nodeName != 'SELECT'){
          events.triggerMouseEvent(element, 'mousedown', true);
          events.triggerMouseEvent(element, 'mouseup', true);
        }
        events.triggerMouseEvent(element, 'click', true);
      }

    return true;
  };

  //Double click for Safari
  wm.ctrl.doubleClick = function(p) {
    var element = elementslib.lookup(p);
    events.triggerEvent(element, 'focus', false);
    events.triggerMouseEvent(element, 'dblclick', true);
    events.triggerEvent(element, 'blur', false);
  };

  //Type Function
  wm.ctrl.type = function (p){

    var element = elementslib.lookup(p);
    //clear the box
    element.value = '';
    //Get the focus on to the item to be typed in, or selected
    events.triggerEvent(element, 'focus', false);
    events.triggerEvent(element, 'select', true);

    //Make sure text fits in the textbox
    var maxLengthAttr = element.getAttribute("maxLength");
    var actualValue = p.text;
    var stringValue = p.text;

    if (maxLengthAttr != null) {
      var maxLength = parseInt(maxLengthAttr);
      if (stringValue.length > maxLength) {
        //truncate it to fit
        actualValue = stringValue.substr(0, maxLength);
      }
    }

    var s = actualValue;
    for (var c = 0; c < s.length; c++){
       element.value += s.charAt(c);
       events.triggerKeyEvent(element, 'keydown', s.charAt(c), true, false,false, false,false);
       events.triggerKeyEvent(element, 'keypress', s.charAt(c), true, false,false, false,false); 
       events.triggerKeyEvent(element, 'keyup', s.charAt(c), true, false,false, false,false);
    }
    // DGF this used to be skipped in chrome URLs, but no longer.  Is xpcnativewrappers to blame?
    //Another wierd chrome thing?
    events.triggerEvent(element, 'change', true);
  };

};

if (/MSIE[\/\s](\d+\.\d+)/.test(navigator.userAgent)){

  wm.ctrl.click = function(p){        
    var element = elementslib.lookup(p);
    events.triggerEvent(element, 'focus', false);

    // And since the DOM order that these actually happen is as follows when a user clicks, we replicate.
    //try {events.triggerMouseEvent(element, 'mousedown', true); } catch(err){}
    //try {events.triggerMouseEvent(element, 'mouseup', true); } catch(err){}
    wm.ctrl.mouseDown(p);
    wm.ctrl.mouseUp(p);
    try {events.triggerMouseEvent(element, 'click', true); } catch(err){}
  };

  //there is a problem with checking via click in safari
  wm.ctrl.check = function(p){
    return wm.ctrl.click(p);
  }

  //Radio buttons are even WIERDER in safari, not breaking in FF
  wm.ctrl.radio = function(p){
    return wm.ctrl.click(p);
  }

  //double click for ie
  wm.ctrl.doubleClick = function(p){      
     var element = elementslib.lookup(p);
     events.triggerEvent(element, 'focus', false);
     // Trigger the mouse event.
     events.triggerMouseEvent(element, 'dblclick', true);   
     events.triggerEvent(element, 'blur', false);       
  };

  //Type Function
   wm.ctrl.type = function (p){

     var element = elementslib.lookup(p);

     //clear the box
     element.value = '';
     //Get the focus on to the item to be typed in, or selected
     events.triggerEvent(element, 'focus', false);
     events.triggerEvent(element, 'select', true);

     //Make sure text fits in the textbox
     var maxLengthAttr = element.getAttribute("maxLength");
     var actualValue = p.text;
     var stringValue = p.text;

     if (maxLengthAttr != null) {
       var maxLength = parseInt(maxLengthAttr);
       if (stringValue.length > maxLength) {
         //truncate it to fit
         actualValue = stringValue.substr(0, maxLength);
       }
     }

     var s = actualValue;
     for (var c = 0; c < s.length; c++){
       element.value += s.charAt(c);
       events.triggerKeyEvent(element, 'keydown', s.charAt(c), true, false,false, false,false);
       events.triggerKeyEvent(element, 'keypress', s.charAt(c), true, false,false, false,false); 
       events.triggerKeyEvent(element, 'keyup', s.charAt(c), true, false,false, false,false);
     }

     // DGF this used to be skipped in chrome URLs, but no longer.  Is xpcnativewrappers to blame?
     //Another wierd chrome thing?
     events.triggerEvent(element, 'change', true);
   };
};    

//Load opera specific controller methods
if (/Opera[\/\s](\d+\.\d+)/.test(navigator.userAgent)){
  
  wm.browser = "Opera";
  wm.ctrl.click = function(p){        
     var element = elementslib.lookup(p);
     events.triggerEvent(element, 'focus', false);

     // And since the DOM order that these actually happen is as follows when a user clicks, we replicate.
     try {events.triggerMouseEvent(element, 'mousedown', true); } catch(err){}
     try {events.triggerMouseEvent(element, 'mouseup', true); } catch(err){}
     try {events.triggerMouseEvent(element, 'click', true); } catch(err){}
  };

 //Sometimes opera requires that you manually toggle it
 wm.ctrl.check = function(p){
   //return wm.ctrl.click(p);
   var element = elementslib.lookup(p);
   events.triggerEvent(element, 'focus', false);

   var state = element.checked;
   // And since the DOM order that these actually happen is as follows when a user clicks, we replicate.
   try {events.triggerMouseEvent(element, 'mousedown', true); } catch(err){}
   try {events.triggerMouseEvent(element, 'mouseup', true); } catch(err){}
   try {events.triggerMouseEvent(element, 'click', true); } catch(err){}

   //if the event firing didn't toggle the checkbox, do it directly
   if (element.checked == state){
     if (element.checked){
       element.checked = false;
     }
     else {
       element.checked = true;
     }
   }
 };

 //Radio buttons are even WIERDER in safari, not breaking in FF
wm.ctrl.radio = function(p){
   return wm.ctrl.click(p);
 };

 //double click for ie
wm.ctrl.doubleClick = function(p){      
   var element = elementslib.lookup(p);
   events.triggerEvent(element, 'focus', false);
   events.triggerMouseEvent(element, 'dblclick', true);   
   events.triggerEvent(element, 'blur', false);       
 };

 //Type Function
 wm.ctrl.type = function (p){
   var element = elementslib.lookup(p);
   //clear the box
   element.value = '';
   //Get the focus on to the item to be typed in, or selected
   events.triggerEvent(element, 'focus', false);
   events.triggerEvent(element, 'select', true);

   //Make sure text fits in the textbox
   var maxLengthAttr = element.getAttribute("maxLength");
   var actualValue = p.text;
   var stringValue = p.text;

   if (maxLengthAttr != null) {
    var maxLength = parseInt(maxLengthAttr);
    if (stringValue.length > maxLength) {
      //truncate it to fit
      actualValue = stringValue.substr(0, maxLength);
    }
   }

   var s = actualValue;
   for (var c = 0; c < s.length; c++){
    element.value += s.charAt(c);
    events.triggerKeyEvent(element, 'keydown', s.charAt(c), true, false,false, false,false);
    events.triggerKeyEvent(element, 'keypress', s.charAt(c), true, false,false, false,false); 
    events.triggerKeyEvent(element, 'keyup', s.charAt(c), true, false,false, false,false);
   }

   // DGF this used to be skipped in chrome URLs, but no longer.  Is xpcnativewrappers to blame?
   //Another wierd chrome thing?
   events.triggerEvent(element, 'change', true);

 };
};

/****************************/
/* asserts
/*******************/

wm.ctrl.asserts.assertRegistry = {
  'assertTrue': {
  expr: function (a) {
      if (typeof a != 'boolean') {
        throw('Bad argument to assertTrue.');
      }
      return a === true;
    },
  errMsg: 'expected true but was false.'
  },

  'assertFalse': {
  expr: function (a) {
      if (typeof a != 'boolean') {
        throw('Bad argument to assertFalse.');
      }
      return a === false;
    },
  errMsg: 'expected false but was true.'
  },

  'assertEquals': {
  expr: function (a, b) { return a === b; },
  errMsg: 'expected $1 but was $2.'
  },

  'assertNotEquals': {
  expr: function (a, b) { return a !== b; },
  errMsg: 'expected one of the two values not to be $1.'
  },

  'assertNull': {
  expr: function (a) { return a === null; },
  errMsg: 'expected to be null but was $1.'
  },

  'assertNotNull': {
  expr: function (a) { return a !== null; },
  errMsg: 'expected not to be null but was null.'
  },

  'assertUndefined': {
  expr: function (a) { return typeof a == 'undefined'; },
  errMsg: 'expected to be undefined but was $1.'
  },

  'assertNotUndefined': {
  expr: function (a) { return typeof a != 'undefined'; },
  errMsg: 'expected not to be undefined but was undefined.'
  },

  'assertNaN': {
  expr: function (a) { return isNaN(a); },
  errMsg: 'expected $1 to be NaN, but was not NaN.'
  },

  'assertNotNaN': {
  expr: function (a) { return !isNaN(a); },
  errMsg: 'expected $1 not to be NaN, but was NaN.'
  },

  'assertEvaluatesToTrue': {
  expr: function (a) { return !!a; },
  errMsg: 'value of $1 does not evaluate to true.'
  },

  'assertEvaluatesToFalse': {
  expr: function (a) { return !a; },
  errMsg: 'value of $1 does not evaluate to false.'
  },

  'assertContains': {
  expr: function (a, b) {
      if (typeof a != 'string' || typeof b != 'string') {
        throw('Bad argument to assertContains.');
      }
      return (a.indexOf(b) > -1);
    },
  errMsg: 'value of $1 does not contain $2.'
  }
};

//Currently only does one level below the provided div
//To make it more thorough it needs recursion to be implemented later
wm.ctrl.asserts.assertText = function (p) {

  var n = elementslib.lookup(p);
  var validator = p.validator;
  if (n.innerHTML.indexOf(validator) != -1){
    return true;
  }
  if (n.hasChildNodes()){
    for(var m = n.firstChild; m != null; m = m.nextSibling) {
      //for non text nodes
      if (m.nodeType != 3){
        if (m.innerHTML.indexOf(validator) != -1){
          return true;
        }
        if (m.value.indexOf(validator) != -1){
          return true;
        }
      }
    }
  }
  throw "Text '"+validator+"' was not found in the provided node.";
};

//Assert that a specified node exists
wm.ctrl.asserts.assertNode = function (p) {
  var element = elementslib.lookup(p);
};

//Assert that a form element contains the expected value
wm.ctrl.asserts.assertValue = function (p) {
  var n = elementslib.lookup(p);
  var validator = p.validator;

  if (n.value.indexOf(validator) == -1){
    throw "Value not found, "+ n.value + "not equal to "+ validator;
  }
  
};

//Assert that a provided value is selected in a select element
wm.ctrl.asserts.assertJS = function (p) {
  var js = p.js;
  var result = eval(js);
  if (result != true){
    throw "JavaScript did not return true."
  }
};

//Asserting javascript with an element object available
wm.ctrl.asserts.assertElemJS = function (p) {
  var element = elementslib.lookup(p);
  var js = p.js;
  var result = eval(js);
  if (result != true){
    throw "JavaScript did not return true."
  }
};

//Assert that a provided value is selected in a select element
wm.ctrl.asserts.assertSelected = function (p) {
  var n = elementslib.lookup(p);
  var validator = p.validator;

  if ((n.options[n.selectedIndex].value != validator) && (n.options[n.selectedIndex].innerHTML != validator)){
    throw "Not selected, "+n.options[n.selectedIndex].value+" is not equal to " + validator;
  }
};

//Assert that a provided checkbox is checked
wm.ctrl.asserts.assertChecked = function (p) {
  var n = elementslib.lookup(p);

  if (!n.checked){
    throw "Checked property not true";
  }
};

// Assert that a an element's property is a particular value
wm.ctrl.asserts.assertProperty = function (p) {
  var element = elementslib.lookup(p);
  var vArray = p.validator.split('|');
  var value = eval ('element.' + vArray[0]+';');
  
  if (value.indexOf(vArray[1]) != -1){
    return true;
  }
  if (String(value) == String(vArray[1])) {
    return true;
  }
  
  throw "Property did not match."
};

// Assert that a specified image has actually loaded
// The Safari workaround results in additional requests
// for broken images (in Safari only) but works reliably
wm.ctrl.asserts.assertImageLoaded = function (p) {
  var img = elementslib.lookup(p);
  if (!img || img.tagName != 'IMG') {
    throw "The node was not an image."
  }
  var comp = img.complete;
  var ret = null; // Return value

  // Workaround for Safari -- it only supports the
  // complete attrib on script-created images
  if (typeof comp == 'undefined') {
    test = new Image();
    // If the original image was successfully loaded,
    // src for new one should be pulled from cache
    test.src = img.src;
    comp = test.complete;
  }

  // Check the complete attrib. Note the strict
  // equality check -- we don't want undefined, null, etc.
  // --------------------------
  // False -- Img failed to load in IE/Safari, or is
  // still trying to load in FF
  if (comp === false) {
    throw "Image complete attrib false."
  }
  // True, but image has no size -- image failed to
  // load in FF
  else if (comp === true && img.naturalWidth == 0) {
    throw "Image has no size, failure to load."
  }
  // Otherwise all we can do is assume everything's
  // hunky-dory
  else {
    ret = true;
  }
  return ret;
};

wm.ctrl.asserts._AssertFactory = new function () {
  var _this = this;
  function validateArgs(count, args) {
    if (!(args.length == count ||
	  (args.length == count + 1 && typeof(args[0]) == 'string') )) {
      throw('Incorrect arguments passed to assert function');
    }
  }
  function createErrMsg(msg, arr) {
    var str = msg;
    for (var i = 0; i < arr.length; i++) {
      //When calling jum functions arr is an array with a null entry
      if (arr[i] != null){
        var val = arr[i];
        var display = '<' + val.toString().replace(/\n/g, '') +
          '> (' + getTypeDetails(val) + ')';
        str = str.replace('$' + (i + 1).toString(), display);
      }
    }
    return str;
  }
  function getTypeDetails(val) {
    var r = typeof val;
    try {
      if (r == 'object' || r == 'function') {
        var m = val.constructor.toString().match(/function\s*([^( ]+)\(/);
						 if (m) { r = m[1]; }
						 else { r = 'Unknown Data Type' }
						 }
      }
      finally {
        r = r.substr(0, 1).toUpperCase() + r.substr(1);
        return r;
      }
    }
    this.createAssert = function (meth) {
      return function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(meth);
      return _this.doAssert.apply(_this, args);
      }
    }
    this.doAssert = function () {
      // Convert arguments to real Array
      var args = Array.prototype.slice.call(arguments);
      // The actual assert method, e.g, 'equals'
      var meth = args.shift();
      // The assert object
      var asrt = wm.ctrl.asserts.assertRegistry[meth];
      // The assert expresion
      var expr = asrt.expr;
      // Validate the args passed
      var valid = validateArgs(expr.length, args);
      // Pull off additional comment which may be first arg
      var comment = args.length > expr.length ?
        args.shift() : null;
      // Run the assert
      var res = expr.apply(window, args);
      if (res) {
	      return true;
      }
      else {
        var message = meth + ' -- ' +        
        createErrMsg(asrt.errMsg, args);
        
	      throw new wm.ctrl.asserts._WindmillAssertException(comment, message);
      }
    };
  };

// Create all the assert methods on wm.ctrl.asserts
// Using the items in the assertRegistry
for (var meth in wm.ctrl.asserts.assertRegistry) {
  wm.ctrl.asserts[meth] = wm.ctrl.asserts._AssertFactory.createAssert(meth);
  wm.ctrl.asserts[meth].jsUnitAssert = true;
}

wm.ctrl.asserts._WindmillAssertException = function (comment, message) {
  this.comment = comment;
  this.message = message;
};


