export default async function t2ml(text) {
    let { left, middle, right, end } = extractParts(text);
    if (end) {
            middle = middle.replace(/@lb|@rb|@lp|@rp/g, match => ({
                '@lb': '[',
                '@rb': ']',
                '@lp': '(',
                '@rp': ')'
            }[match]));
          return middle
    } else {
        let code = await codeMaker(middle);
        text = left + code + right;
        return await  t2ml(text);
    }
}

function extractParts(text) {
    let lastOpenParenMatch = text.match(/.*\((?=\w)/gs);
    let lastOpenParen = lastOpenParenMatch ? lastOpenParenMatch[0].lastIndexOf('(') : -1;
    let closestCloseBracket = text.indexOf(']', lastOpenParen);
    if (lastOpenParen === -1 || closestCloseBracket === -1) {
        return { left: '', middle: text, right: '', end: true };
    }
    let middle = text.substring(lastOpenParen, closestCloseBracket + 1);
    let left = text.substring(0, lastOpenParen);
    let right = text.substring(closestCloseBracket + 1);
    return { left, middle, right, end: false };
}

function contentSelector(input) {
    let matches = [];
    let stack = [];
    let startIndex = -1;
    for (let i = 0; i < input.length; i++) {
        if (input[i] === '[') {
            if (stack.length === 0) {
                startIndex = i;
            }
            stack.push('[');
        } else if (input[i] === ']') {
            stack.pop();
            if (stack.length === 0 && startIndex !== -1) {
                matches.push(input.substring(startIndex, i + 1));
                startIndex = -1;
            }
        }
    }
    return matches;
}

function parameterSelector(input) {
    const match = input.match(/\(([^)]+)\)/);
    return match ? match[0] : null;
}

function classSelector(input) {
    const matches = input.match(/(?:^|\s)\.\w+\b/g);
    return matches ? matches.map(match => match.trim()) : [];
}

function IDSelector(input) {
    const matches = input.match(/\#\S+\b/g);
    return matches ? matches : [];
}

function attrSelector(input) {
    const matches = input.match(/@\S+?(?=\s|[@#.)]|$)/g);
    return matches ? matches : [];
}

function attrName(input) {
    const matches = input.match(/@\w+([-\w]*)/g);
    return matches ? matches : [];
}

function attrValueSelector(input) {
    const matches = input.match(/=[^\s]+/g);
    return matches ? matches.map(match => match.replaceAll(',', ' ').slice(1)) : [];
}

async function codeMaker(tag) {
    let parameterProperties = parameterSelector(tag);
    let character = parameterProperties.match(/\(\w+/)[0].replace(/[^\w]/g, '');
    let classNamesArray = classSelector(parameterProperties).map(className => className.slice(1)).join(' ');
    let classAttr = classNamesArray ? ` class='${classNamesArray}'` : '';
    let idValue = IDSelector(parameterProperties)[0];
    idValue = idValue ? ` id='${idValue.slice(1)}'` : '';
    let attrsArray = attrSelector(parameterProperties).map(attr => {
        let attrname = attrName(attr).map(n => n.slice(1));
        let attrvalue = attrValueSelector(attr).map(n => n).join(' ');
        let fullattr = ` ${attrname}='${attrvalue}'`;
        return fullattr;
    }).join(' ');
    let selfClose = contentSelector(tag).map(c => c).join('');
    if (selfClose === '[/]') {
        let code = `<${character}${classAttr}${idValue}${attrsArray}/>`;
        return code;
    } else if (selfClose === '[]') {
        let code = `<${character}${classAttr}${idValue}${attrsArray}>`;
        return code;
    } else {
        let content = contentSelector(tag).map(c => c.slice(1, -1)).join('');
        let code = `<${character}${classAttr}${idValue}${attrsArray}>${content}</${character}>`;
        return code;
    }
}

