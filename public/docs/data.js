/**
 * @typedef {{title: string, src: string, subs: Array<ITextPage>}} ITextPage
 * @type {ITextPage}
 */
export const PAGES = {
    title: "Nossa Missão",
    src: "./texts/index.txt",
    subs: [
        {
            title: "Pesquisa de Mercado",
            src: "./texts/market-research.txt",
            subs: []
        },
        {
            title: "Objetivos",
            src: "./texts/objectives.txt",
            subs: []
        },
        {
            title: "Tecnologias",
            src: "./texts/technologies.txt",
            subs: []
        },
    ]   
};