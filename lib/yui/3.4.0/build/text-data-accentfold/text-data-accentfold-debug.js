/*
YUI 3.4.0 (build 3928)
Copyright 2011 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/
YUI.add('text-data-accentfold', function(Y) {

// The following tool was very helpful in creating these mappings:
// http://unicode.org/cldr/utility/list-unicodeset.jsp?a=[:toNFKD%3D/^a/:]&abb=on

Y.namespace('Text.Data').AccentFold = {
    0: /[⁰₀⓪０]/gi,
    1: /[¹₁①１]/gi,
    2: /[²₂②２]/gi,
    3: /[³₃③３]/gi,
    4: /[⁴₄④４]/gi,
    5: /[⁵₅⑤５]/gi,
    6: /[⁶₆⑥６]/gi,
    7: /[⁷₇⑦７]/gi,
    8: /[⁸₈⑧８]/gi,
    9: /[⁹₉⑨９]/gi,
    a: /[ªà-åāăąǎǟǡǻȁȃȧᵃḁẚạảấầẩẫậắằẳẵặⓐａ]/gi,
    b: /[ᵇḃḅḇⓑｂ]/gi,
    c: /[çćĉċčᶜḉⓒｃ]/gi,
    d: /[ďᵈḋḍḏḑḓⅾⓓｄ]/gi,
    e: /[è-ëēĕėęěȅȇȩᵉḕḗḙḛḝẹẻẽếềểễệₑℯⓔｅ]/gi,
    f: /[ᶠḟⓕｆ]/gi,
    g: /[ĝğġģǧǵᵍḡℊⓖｇ]/gi,
    h: /[ĥȟʰḣḥḧḩḫẖℎⓗｈ]/gi,
    i: /[ì-ïĩīĭįĳǐȉȋᵢḭḯỉịⁱℹⅰⓘｉ]/gi,
    j: /[ĵǰʲⓙⱼｊ]/gi,
    k: /[ķǩᵏḱḳḵⓚｋ]/gi,
    l: /[ĺļľŀǉˡḷḹḻḽℓⅼⓛｌ]/gi,
    m: /[ᵐḿṁṃⅿⓜｍ]/gi,
    n: /[ñńņňǹṅṇṉṋⁿⓝｎ]/gi,
    o: /[ºò-öōŏőơǒǫǭȍȏȫȭȯȱᵒṍṏṑṓọỏốồổỗộớờởỡợₒℴⓞｏ]/gi,
    p: /[ᵖṕṗⓟｐ]/gi,
    q: /[ʠⓠｑ]/gi,
    r: /[ŕŗřȑȓʳᵣṙṛṝṟⓡｒ]/gi,
    s: /[śŝşšſșˢṡṣṥṧṩẛⓢｓ]/gi,
    t: /[ţťțᵗṫṭṯṱẗⓣｔ]/gi,
    u: /[ù-üũūŭůűųưǔǖǘǚǜȕȗᵘᵤṳṵṷṹṻụủứừửữựⓤｕ]/gi,
    v: /[ᵛᵥṽṿⅴⓥｖ]/gi,
    w: /[ŵʷẁẃẅẇẉẘⓦｗ]/gi,
    x: /[ˣẋẍₓⅹⓧｘ]/gi,
    y: /[ýÿŷȳʸẏẙỳỵỷỹⓨｙ]/gi,
    z: /[źżžᶻẑẓẕⓩｚ]/gi
};


}, '3.4.0' );
