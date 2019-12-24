// 'use strict';

// Injects the 'window' into 
require('browser-env')()

// File2Html
const file2html = require('file2html')
const OOXMLReader = require('file2html-ooxml').default
const fs = require('fs')
const path = require('path')
const { dirname, basename } = path
const util = require('util')
// const exec = util.promisify(require('child_process').exec)
const { exec } = require('child_process');

// Mammoth
const mammoth = require('mammoth-colors')

// Utilities
const createNode = require('create-node')
const walk = require('domwalk')

const getParentsUntil = require('./jQueryHelpers');

async function convertFile(buffer, filePath = null) {

    if (!filePath) throw Error('A file path was not specified!')

    let initialHtml = await convertFile2Html(buffer)
        .catch(console.error)
    if (!initialHtml) throw new Error('No html came back from File2Html!')

    let mammothHtml = await convertWithMammoth_FromCLI(filePath)
        .catch(console.error)
    if (!mammothHtml) throw new Error('No html came back from Mammoth!')

    // mammothHtml = sanitize(mammothHtml)

    /* Bake Down CSS to File2Html Tag Data */
    initialHtml = await bakeCssToInlineStyles(initialHtml.css, initialHtml.html).catch(console.error)

    /* Flatten Data */
    let finalHTML = await flattenStyles(mammothHtml, initialHtml).catch(console.error)

    /* Send Data back to Store as resolved promise data */
    if (finalHTML) {
        console.log('Conversion complete!')
        let currentDirectory = dirname(filePath)
        let styledHtmlPath = path.join(currentDirectory, basename(filePath).replace('docx', 'html'))
        fs.writeFileSync(styledHtmlPath, finalHTML)
        console.info(`Final result saved to ${styledHtmlPath}`)
    }
}


///////////////////////////////////////////////////
//         FILE 2 HMTL CONVERSION        //
///////////////////////////////////////////////////

const convertFile2Html = async (fileBuffer) => {

    file2html.config({ readers: [OOXMLReader] });

    const data = await file2html.read({
        fileBuffer,
        meta: { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    })

    return {
        css: data.data.styles,
        html: data.data.content
    }
}

///////////////////////////////////////////////////
//          MAMMOTH CONVERSION          //
///////////////////////////////////////////////////


const mammothOptions = {
    styleMap: [
        "p[style-name='Title'] => h1.title",
        "p[style-name='Subtitle'] => h4.subtitle",
        "p[style-name='heading 5'] => h5",
        "p[style-name='Heading 5'] => h5",
        "p[style-name='heading 6'] => h6",
        "p[style-name='Heading 6'] => h6",
        "p[style-name='Quote'] => blockquote.quote",
        "p[style-name='Intense Quote'] => blockquote.intense-quote > strong",
        "i => em",
        "u => ins",
        "strike => del",
    ]
};

/* Fix Carraige Returns */
const sanitize = (html) => html.replace(/[\<]+[br]+[\s]?[\/]+[\>]+[\s]?[\<]+[br]+[\s]?[\/]+[\>]/g, '<p/><p>')

/**
 * Convert file from local file system's CLI (must be Linux, we don't do Windows [ew]) 
 */
const convertWithMammoth_FromCLI = async (filePath) => {

    const styleFile = 'stylemap.txt'
    let currentDirectory = dirname(filePath);
    console.log(`Directory for CLI work: ${currentDirectory}`);

    let fileName = basename(filePath)
    let htmlFileName = fileName.replace("docx", "html")
    let htmlWritePath = path.join(currentDirectory, htmlFileName);
    let stylePath = path.join(currentDirectory, styleFile)

    // Write the style map down.
    await fs.writeFile(stylePath, mammothOptions.styleMap.toString(), () => {
        console.log(`Wrote down styles to ${stylePath}!`);
    })

    let mammothHtml = null

    // Convert using Linux bash CLI & mammoth npm package.    
    let command = `mammoth ${filePath} --style-map ${stylePath} > ${htmlWritePath}`
    await runCommand(command).catch(console.error)

    mammothHtml = fs.readFileSync(htmlWritePath, { encoding: 'utf-8' }, (error, data) => {
        if (error) throw error
    })

    //Cleanup temp file
    fs.unlinkSync(htmlWritePath)

    return sanitize(mammothHtml);
}

/**
 * Executes a shell command and return it as a Promise.
 * @param shellCommand {string}
 * @return {Promise<string>}
 */
function runCommand(shellCommand) {
    return new Promise((resolve, reject) => {
        exec(shellCommand, (error, stdout, stderr) => {
            // if (error) {
            //     console.warn(error);
            // }
            // resolve(stdout ? stdout : stderr);
            resolve(true)
        });
    });
}

///////////////////////////////////////////////////
//            CSS TO INLINE STYLES            //
///////////////////////////////////////////////////

const bakeCssToInlineStyles = async (css, html) => {
    // Make CSS Classes Object with Inline Styles
    const cssClasses = await mapCssStylesheetToObject(css)
    // Virtualize Html into Traversable DOM
    const dom = createNode(html)
    // Traverse DOM and Paste Styles to Class Elements
    const domInline = await mapCssClassesToInlineStyles(dom, cssClasses)
    // return css + html
    return domInline.innerHTML
}

const mapCssStylesheetToObject = async (css) => {
    let stylesheet = createNode(css)
    stylesheet = stylesheet.innerHTML
    let blocks = stylesheet.match(/[^{]*\{([^}]*)*}/g)
    let cssClasses = {}
    blocks.forEach(block => {
        let cssRegex = /\.([a-zA-Z-\d+]*)\s*\.?([a-zA-Z-\d+]*)?\{(.*)\}/g //for separating css selectors from their attributes and storing them in groups.
        let groups = cssRegex.exec(block)
        let classNamePrimary = groups[1]
        let classNameSecondary = groups[2]
        let attributes = groups[3]
        let classNameFull = classNamePrimary + " " + classNameSecondary
        if (groups) {
            // does css class already exist from previous loop?
            if (!cssClasses[classNamePrimary]) {
                if (!classNameSecondary) {
                    // parent doesn't exist, create a parent class.
                    cssClasses[classNamePrimary] = {
                        styles: attributes
                    }
                } else {
                    // parent doesn't exist but this is a subchild class. Create the would-be parent and add a child subclass.
                    cssClasses[classNamePrimary] = {}
                    cssClasses[classNamePrimary][classNameFull] = {
                        styles: attributes
                    }
                }
            } else {
                // parent already exists. Get the classname and add two sub classes.
                let previousStyles = cssClasses[classNamePrimary].styles
                cssClasses[classNamePrimary] = {}
                cssClasses[classNamePrimary][classNamePrimary] = {
                    styles: previousStyles
                }
                cssClasses[classNamePrimary][classNameFull] = {
                    styles: attributes
                }
            }
        }
    })
    return cssClasses
}

const mapCssClassesToInlineStyles = async (dom, cssClasses) => {
    walk(dom, function (node) {
        if (node.className) {
            let nodeClasses = node.classList
            nodeClasses.forEach(nodeClass => {
                //todo: refactor cssClasses[..] and cssClasses[..][..] into named vars reflecting their purpose, e.g. firstElement, secondElement...
                if (cssClasses[nodeClass]) { // If there is a matching classname entry
                    if (cssClasses[nodeClass].styles) { // If there is no substyles
                        node.style.cssText += cssClasses[nodeClass].styles
                    } else {
                        if (cssClasses[nodeClass][nodeClass]) {
                            node.style.cssText += cssClasses[nodeClass][nodeClass].styles
                        } else if (cssClasses[nodeClass][`${nodeClass} r`]) {
                            node.style.cssText += cssClasses[nodeClass][`${nodeClass} r`].styles
                        } else if (cssClasses[nodeClass][nodeClass] && cssClasses[nodeClass][`${nodeClass} r`]) { } else { }
                    }
                }
            })
        }
    });
    return dom
}

/////////////////////////////////////////////////////////////////////////
//      COMBINE FILE2HTML & MATMMOTH RESULTS      //
/////////////////////////////////////////////////////////////////////////

// Lets Decorate the Cake!
const flattenStyles = async (baseDom, augDom) => {

    // Gather Ingredients for Cake
    const cake = createNode(wrapInDiv(baseDom))
    let cakeArray = []
    walk(cake, (cakeNode) => {
        if (!cakeNode.tagName) {
            let span = document.createElement("span")
            span.textContent = cakeNode.textContent
            cakeNode.replaceWith(span) // Replace floating text with wrapped Span tag
            cakeArray.push(span) // Push cake reference
        } else {
            cakeArray.push(cakeNode)
        }
    });

    // Gather Ingredients for Icing
    const icing = createNode(wrapInDiv(augDom))
    let icingArray = []
    walk(icing, function (icingNode) {
        if (icingNode.tagName) {
            icingArray.push(icingNode) // Push icing reference
        }
    });

    // Ignore Parent Divs for cake and icing
    cakeArray = cakeArray.slice(1)
    icingArray = icingArray.slice(1)

    // Filter out good Icing Nodes
    icingArray = icingArray.filter(icingNode => {
        return icingNode.style && icingNode.textContent
    })

    // Map Icing to Valid Cakes
    let highlights = []
    icingArray.forEach(icingNode => {

        // Get Good Icing Flavors
        let flavors = getGoodFlavors(icingNode, highlights) // pushes highlights as well

        // Locate Good / Bad Cakes and Store References
        let goodCakes = getGoodCakes(cakeArray, icingNode)

        // Decorate Good Cakes
        if (goodCakes.length) {
            goodCakes.forEach(cakeNode => {
                decorateCake(cakeNode, icingNode, flavors)
            })
        }

    })

    // Create Highlights
    createHighlights(highlights)

    // Serve Cake, Yum!
    return cake.innerHTML

    //////////////////////////////////////////////////////////////////
    //      SUB FUCTIONS FOR FLATTENING STYLES     //
    //////////////////////////////////////////////////////////////////

    function wrapInDiv(string) {
        return "<div>" + string + "</div>"
    }

    function getGoodFlavors(icingNode, highlights) {
        // Get Icling Flavors
        let flavors = []
        for (let index = 0; index < icingNode.style.length; index++) {
            flavors.push(icingNode.style[index])
        }
        // Eliminate Bad Flavors
        let badFlavors = ["line-height", "font-family", "margin-top", "margin-bottom", "list-style-type", "margin-right"]
        flavors = flavors.filter(flavor => {
            if (badFlavors.includes(flavor)) {
                return false
            } else {
                if (flavor === "font-size") {
                    if (icingNode.style[flavor] < "18px") {
                        return false
                    } else {
                        return true // Only returns larger than normal font sizes
                    }
                } else if (icingNode.style["background-color"]) {
                    highlights.push(icingNode)
                    return true
                } else {
                    return true
                }
            }
        })
        return flavors
    }

    function getGoodCakes(cakeArray, icingNode) {
        let goodCakes = []
        cakeArray.forEach(cakeNode => {
            if (icingNode.textContent === cakeNode.textContent && icingNode.parentElement.textContent === cakeNode.parentElement.textContent) {
                // Found a perfect match
                goodCakes.push(cakeNode)
            }
        })
        return goodCakes
    }

    function decorateCake(cakeNode, icingNode, flavors) {
        flavors.forEach(name => {
            cakeNode.style[name] = icingNode.style[name]
        })

        // Remove Font-Size from Headings
        let headings = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']
        if (headings.includes(cakeNode.tagName)) {
            cakeNode.style['font-size'] = undefined
        }

        // Made Blockquotes more readable
        if (cakeNode.tagName === "BLOCKQUOTE") {
            cakeNode.style.fontStyle = "italic"
            cakeNode.style.paddingTop = "15px"
            cakeNode.style.paddingBottom = "15px"
            cakeNode.style.color = cakeNode.style.borderTopColor
        }

        // Identify Indented Paragraphs
        if (cakeNode.tagName === "P") {
            if (cakeNode.style.textIndent) {
                cakeNode.className += "indent"
            }
            if (cakeNode.style.marginLeft) {
                cakeNode.className += "block"
            }
        }

        // Clean Up Table Results
        let tableTags = ['TABLE', 'TD']
        if (tableTags.includes(cakeNode.tagName)) {
            if (cakeNode.tagName === 'TABLE') {
                cakeNode.style = "width: 80%; max-width: 100%; position: relative; left: 50%; transform: translateX(-50%); border: 1px solid black; border-collapse: collapse;"
            }
            if (cakeNode.tagName === 'TD') {
                cakeNode.style.border = "1px solid black"
                cakeNode.style.paddingLeft = "12px"
                cakeNode.style.paddingRight = "12px"
            }
        }

    }

    // icing nodes are CSS styles applied onto cake (html) nodes which are from Mammoth
    function createHighlights(highlights) {
        highlights.forEach(icingNode => {

            let blockChildren = getParentsUntil(icingNode.parentElement, "div")[0].children;

            let parentChildren = []
            for (let index = 0; index < blockChildren.length; index++) {
                parentChildren.push({
                    element: icingNode.parentElement.children[index],
                    index: index
                })
            }


            let targetElements = parentChildren.filter(child => {
                return icingNode.textContent === child.element.textContent
            })


            let targetElementIndex = targetElements[0].index
            let targetElement = icingNode.parentElement.children[targetElementIndex]
            let targetElementText = targetElement.textContent

            // Get Previous Context
            let previousChildren = parentChildren.slice(0, targetElementIndex)
            let previousContext = ''
            previousChildren.forEach(child => {
                previousContext += child.element.textContent
            })
            previousContext = previousContext.slice(previousContext.length - 10, previousContext.length)

            // Get Next Context
            let nextChildren = parentChildren.slice(targetElementIndex + 1)
            let nextContext = ''
            nextChildren.forEach(child => {
                nextContext += child.element.textContent
            })
            nextContext = nextContext.slice(0, 10)

            // Combine Context
            let icingContext = previousContext + targetElementText + nextContext

            // Find Cake Blocks with Icing Context
            let blocks = []
            for (let index = 0; index < cake.children.length; index++) {
                blocks.push(cake.children[index])
            }
            blocks = blocks.filter(block => {
                return block.textContent.includes(icingContext)
            })

            blocks.forEach(block => {
                block.innerHTML = block.innerHTML.replace(icingNode.textContent, "<span class='highlight'  style='background-color: " + icingNode.style.backgroundColor + ";'>" + icingNode.textContent + "</span>")
            })

        })
    }
}

module.exports = {
    convertFile
}