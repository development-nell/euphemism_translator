var translation_map = {
	'bitcoin(?:s)?':'failbux',
	'node.js':'bad-ass rock star tech',
	'work(?:[/-])life balance':'we are actually going to work you to death',
	'rockstar developer(?:s)?':'Someone we are going to work to death',
	"Devil's advocate":'Turkey Fucker',
};

var trans_compiled = {};

var translate_re;
var finalize = new RegExp('--placeholder-(\\d)--','i');

chrome.storage.local.get('translate',function(object) {
	if (Object.keys(object).length==0) {
		ue_save(translation_map);
	} else {
		translation_map=object.translate;;
	}

	translate_re = ue_recompile();
	document.title = replaceText(document.title,true)||document.title;
    walk(document.body);
});

function walk(node) {

	// I stole this function from here:
	// http://is.gd/mwZp7E

	if (node.nodeName.match(/(script|style|form|input|textarea|select)/i)) {
		return;
	}

	switch ( node.nodeType )  {
		case 1:  // Element
		case 9:  // Document
		case 11: // Document fragment
			Array.from(node.childNodes).forEach(function(child) {
				if (child.nodeType==3) {
					if (child.nodeValue!=null && child.nodeValue.length>0) {
						var newNode = replaceText(child.nodeValue);
						if (newNode!=null) {
							child.parentNode.replaceChild(newNode,child);
						}
					}
				} else {
					if (child.hasChildNodes())  {
						walk(child);
					}
				}	
			});
			break;
	}
}

function replaceText(text,plainText) {

	var replace_with=[];
	var repcount=0;

	if (!translate_re.test(text)) {	
		return null;
	}

	Object.keys(translation_map).forEach(function(pattern) {
		var translater = trans_compiled[pattern];
		var matches;
		while (matches = translater.exec(text)) {
			if (matches[0].match(/^[*]/)) {
				text = text.replace(matches[0],"--placeholder-"+repcount+"--");
            	repcount++;
            	replace_with.push(document.createTextNode(matches[0]));
			} else {
				var translated = preserve_plurals_and_capitalization(translation_map[pattern],matches[0]);

				text = text.replace(matches[0],"--placeholder-"+repcount+"--");
				repcount++;

            	var container = document.createElement("span");

            	container.setAttribute("pattern",pattern);
            	container.className="uneuphemized";
            	container.setAttribute("title","Click To Change Value");
            	container.addEventListener("click",update_translation);
            	container.appendChild(document.createTextNode(translated));
            	replace_with.push(container);
			}
		}
	});

	var newNode = document.createElement("span");
    newNode.className="ue-processed";

	if (repcount>0) {
		var matches;
		while (matches=finalize.exec(text)) {
			if (matches.index>0) {
            	newNode.appendChild(document.createTextNode(text.substring(0,matches.index)));
        	}
			newNode.appendChild(replace_with[matches[1]]);
			text = text.substring(matches.index+matches[0].length);
		}
		newNode.appendChild(document.createTextNode(text));
		if (plainText) {
			return newNode.textContent;
		} else {
			return newNode;
		}		
	} else {
		return null;
	}
}

function preserve_plurals_and_capitalization(new_text,old_text) {

    if (old_text.match(/(?:[^s]s|es)$/i)) {
    	if (new_text.match(/s$/)) {
       		new_text=new_text+="es";
       } else {
       		new_text=new_text+="s";
       }
    }
	if (old_text.charCodeAt(0)>=65 && old_text.charCodeAt(0)<=90) {
    	new_text = new_text.split(/\s/).map(function(str) {
    		return str.charAt(0).toUpperCase()+str.substring(1,str.length);
    	}).join(" ");
    }

	return new_text;
}

	

function ue_save(options) {
	chrome.storage.local.set({translate:options},function() {
		console.log("just logging something so as not to squander the braces");
	});
}

function ue_recompile() {
	var yams = new RegExp("("+Object.keys(translation_map).join("|")+")","i");
	Object.keys(translation_map).forEach(function(key) {
        trans_compiled[key] = new RegExp('(?:[*])?'+key+'\\b','gi');
    });
	return yams;
}

chrome.extension.onMessage.addListener(function(message) {
	switch(message.info.menuItemId) {
		case "ue-new":
			new_translation(message.info.selectionText);
		break;
		case "ue-bofa":
			walk(document.body);
		break;
    }
});

function new_translation(text) {

	var form = crud_form(text,"");
	$(form).dialog({
		"title":"New Translation",
		"modal":"True",
		"width":640,
		"buttons":[
			{
				text:"OK",click:function() {
					var new_pattern = document.getElementById("ue-pattern").value;
                    var new_text = document.getElementById("ue-value").value;
					translation_map[new_pattern] = new_text;
					translate_re = ue_recompile();

					walk(document.body);
					ue_save(translation_map);
					$(this).dialog("close");	
				}
			},
			{text:"Cancel",click:function() {$(this).dialog("close")}}
		],
	});
}

function update_translation(event) {

    var key = event.srcElement.getAttribute("pattern");
	var form = crud_form(key,translation_map[key]);

	$(form).dialog({
        "title":"Update Translation",
        "modal":"True",
        "width":640,
        "buttons":[
            {
                text:"Update",click:function() {
					var new_pattern = document.getElementById("ue-pattern").value;
					var new_text = document.getElementById("ue-value").value;
					if (new_pattern!=key) {
						delete translation_map[key];
					}
					translation_map[new_pattern] = new_text;
					
					Array.from(document.getElementsByClassName("uneuphemized")).forEach(function(element) {
        				if (element.getAttribute("pattern")==key) {
            				element.innerHTML=preserve_plurals_and_capitalization(new_text,element.innerHTML);
        				}
    				});
    				ue_save(translation_map);
					walk(document.body);
					$(this).dialog("close");
                }
            },
			{
				text:"Delete",
				click:function() {
					delete translation_map[key];
					ue_save(translation_map);
				 	$(this).dialog("close")
				}
			},
            {text:"Cancel",click:function() {$(this).dialog("close")}}
        ],
    });
}


function crud_form(key,value) {

	var holder = document.createElement("div");
    holder.className = "ue-form";
	holder.appendChild(form_row({id:"ue-pattern",name:"ue-pattern",label:"This",value:key}));
	holder.appendChild(form_row({id:"ue-value",name:"ue-value",label:"Really means",value:value}));
	return holder;
}

function form_row(opt) {

	var row = document.createElement("div");
	row.className="ue-form-row";

	var keylabel = document.createElement("label");
	keylabel.for=opt.name;
    keylabel.innerHTML=opt.label;
    row.appendChild(keylabel);

    var sp = document.createElement("input");
    sp.id = opt.id;
    sp.name=opt.name;
    sp.value=opt.value;
    row.appendChild(sp);
	return row;
}

	

