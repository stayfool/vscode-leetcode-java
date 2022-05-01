
import { getWorkspaceFolder } from './settingUtils'

const commentRegExp = /\/\*\*.*\*\//s

/**
 * fillDebugContent
 */
export function fillDebugContent(content: string, language: string, filePath: string) {

    if (language == 'java') {
        return fillJavaDebugContent(content, filePath);
    }

    return content
}

function fillJavaDebugContent(content: string, filePath: string) {

    const debugCode: Array<string> = [];
    debugCode.push('// @debug code=start')

    let codeContent = extractCodeContent(content);

    processJavaDebugCode(codeContent, debugCode, filePath);
    processJavaComment(codeContent, debugCode);

    debugCode.push('// @debug code=end\n')

    debugCode.push(content)

    return debugCode.join('\n');
}

function extractCodeContent(content: string) {
    const codeStartFlag = '// @lc code=start';
    const codeEndFlag = '// @lc code=end';
    let codeContent = content.substring(
        content.indexOf(codeStartFlag) + codeStartFlag.length,
        content.indexOf(codeEndFlag)
    );
    return codeContent;
}

function processJavaComment(codeContent: string, debugCode: Array<string>) {
    const commentMatch = codeContent.match(commentRegExp);
    if (!commentMatch || commentMatch.length == 0) {
        return;
    }

    const classDefinneMatch = commentMatch[0].match(/class\s+\w+\s*{.*}/s);
    if (!classDefinneMatch || classDefinneMatch.length == 0) {
        return;
    }

    const classDefine = classDefinneMatch[0].replace(/\*\s/g, '');
    debugCode.push(classDefine);
}

function processJavaDebugCode(codeContent: string, debugCode: Array<string>, filePath: string) {

    const folderEndIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    let classPackage = filePath.substring(getWorkspaceFolder().length + 1, folderEndIndex).replace(/\/|\\/g, '.');

    if (classPackage) {
        classPackage = 'package ' + classPackage + ';';
    }

    const className = filePath.substring(
        folderEndIndex + 1,
        filePath.lastIndexOf('.'),
    )

    // remove comment
    const commentMatch = codeContent.match(commentRegExp);
    if (commentMatch && commentMatch.length > 0) {
        codeContent = codeContent.substring(commentMatch[0].length + 1);
    }

    let method = codeContent.match(/.*public\s+\w+\s+(\w+)\((.*)\)/);
    method = method ? method : []
    const methodName = method[1]

    let paramsDefine = ''
    let paramsForCall = ''
    method[2].split(',').forEach(param => {
        paramsDefine += '        ' + param.trim() + ';\n'
        paramsForCall += param.trim().split(/\s+/)[1] + ', '
    })
    paramsForCall = paramsForCall ? paramsForCall.substring(0, paramsForCall.length - 2) : '';

    const startCode: Array<string> = []
    startCode.push(`${classPackage}\n`);
    startCode.push(`public class ${className} {`);
    startCode.push(`    public static void main(String[] args) {`);
    startCode.push(`        // TODO generate params by yourself`);
    startCode.push(`${paramsDefine}`);
    startCode.push(`        new Solution().${methodName}(${paramsForCall});`);
    startCode.push(`    }`);
    startCode.push(`}\n`);

    debugCode.push(startCode.join('\n'));
}
