"use strict";
var XsDataType;
(function (XsDataType) {
    XsDataType[XsDataType["Boolean"] = 'xs:boolean'] = "Boolean";
    XsDataType[XsDataType["Integer"] = 'xs:integer'] = "Integer";
    XsDataType[XsDataType["Double"] = 'xs:double'] = "Double";
    XsDataType[XsDataType["AnyURI"] = 'xs:anyURI'] = "AnyURI";
    XsDataType[XsDataType["DateTime"] = 'xs:dateTime'] = "DateTime";
    XsDataType[XsDataType["Duration"] = 'xs:duration'] = "Duration";
    XsDataType[XsDataType["String"] = 'xs:string'] = "String";
})(XsDataType || (XsDataType = {}));
var SpecifInstantiation;
(function (SpecifInstantiation) {
    SpecifInstantiation[SpecifInstantiation["Auto"] = 'auto'] = "Auto";
    SpecifInstantiation[SpecifInstantiation["User"] = 'user'] = "User";
})(SpecifInstantiation || (SpecifInstantiation = {}));
var SpecifTextFormat;
(function (SpecifTextFormat) {
    SpecifTextFormat[SpecifTextFormat["Plain"] = 'plain'] = "Plain";
    SpecifTextFormat[SpecifTextFormat["Xhtml"] = 'xhtml'] = "Xhtml";
})(SpecifTextFormat || (SpecifTextFormat = {}));
