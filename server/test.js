async function downloadVideo ()
{
    let images123 = document.querySelectorAll('image');
    let page = location.toString();
    
    images123.forEach((image) => console.log("\n", image));
    
    const DOWNLOAD_URLS = ["https://docs.google.com/persistent/docs/documents/1M7NjNTSxsszIi9m9muOYlmT6iy4tiJ9DsJJQO9h7L4g/image/1zbZdTs6Hb7LCegWwdwaYlvdgHipXx4B-l3lu94twyw4"];
    const NEEDED_CLICKS = 2;
    
    for (let downloadUrl of DOWNLOAD_URLS)
    {
        let counts = 0;
    
        const buffer = await fetch(downloadUrl).then(resp => resp.arrayBuffer())
        /**
         * @param {err: Error}
         */
        .catch(err => {
            console.error(err);
            return null;
        });
        const blob = new Blob([buffer]);
        const url = URL.createObjectURL(blob)
    
        counts ++;
        if (counts >= NEEDED_CLICKS)
        {
            let a = document.createElement('a');
            const imageurl = url;
            a.href = imageurl;
            a.target = "_blank";
            a.download = imageurl;
            href=
            a.style = ""
            console.log(i.href);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a); 
        }
    }
}
downloadVideo ();