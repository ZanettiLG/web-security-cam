import {PAGES} from "./data.js";

/**
 * @typedef {import("./data.js").ITextPage} ITextPage
 * @typedef {{Array<number>}} PageIndex
 */

var currentPageIndex = [];
let lastPage = null;
let currentPage = null;
const embedPage = document.getElementById("embed_page");
const titlePageButton = document.getElementById("title_page");
const backPageButton = document.getElementById("back_page");
const nextPageButton = document.getElementById("next_page");

/**
 * @param {ITextPage} texts
 * @param {PageIndex} pageIndex
 * @returns 
 */
function matchPage (pageIndex)
{
    if(!pageIndex.length) return PAGES;

    let current = PAGES;
    for (const index of pageIndex)
    {
        const testPage = current.subs[index];
        if(!testPage) throw new Error(`TextPage [${pageIndex}] not exists`);
        current = testPage;
    }

    return current;
}

function updatePage (pageIndex)
{
    const page = matchPage(PAGES, pageIndex);
    lastPage = currentPage;
    backPageButton.hidden = !lastPage ? true : false;
    currentPage = page;
    //nextPageButton.hidden = matchPage(pageIndex.slice(0, -1));
    titlePageButton.textContent = currentPage.title;
    embedPage.src = currentPage.src;
}

/**
 * 
 * @param {Array<number>} currentIndex 
 * @param {number} value 
 * @returns 
 */
function changeIndex (currentIndex, value)
{
    if(!currentIndex || value == 0) return;

    let currentIndexValue = currentIndex[currentIndex.length];
    currentIndexValue += value;

    alert(`Test ${JSON.stringify(currentIndex)} ${value}`)

    if(value != 0)
    {
        try {
            const parentPage = matchPage(currentDepth.slice(0, -1));
            if(currentIndexValue > parentPage.subs.length)
            {
                currentDepth[currentDepth.length-1] += value;
            }
            currentIndex[currentIndex] = currentIndexValue;
            alert(`Changed index is ${currentIndexValue}`);
        } catch (error) {
            currentIndex.push(0);
            alert(`New index is ${0}`);
        }
    }
}

function backPage ()
{
    currentPage = lastPage;
}

function nextPage ()
{
    changeIndex(currentPageIndex.slice(0, -1), 1);
    updatePage(currentPageIndex);
}

backPageButton.onclick = backPage;
nextPageButton.onclick = nextPage;
updatePage(currentPageIndex);