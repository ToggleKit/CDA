window.addEventListener("load", async () => {
  const jData = await setup();
  if (jData.constant) {
    await constantData(jData.constant)
  };
  if (jData.unique) {
    await uniqueData(jData.unique)
  };
  if(jData.css){
    if(jData.css.constant){
      await cssConstant(jData.css);
    };
    if(jData.css.common){
      await cssCommon(jData.css);
    }
  };
  if(jData.script.constant){
    await scriptConstant(jData.script)
  }
  if (jData.script.common) {
    await scriptCommon(jData.script)
  }
  window.addEventListener("popstate", async ()=>{
    if (jData.constant) {
      await constantData(jData.constant)
    };
    if (jData.unique) {
      await uniqueData(jData.unique)
    };
    if (jData.css) {
      if (jData.css.constant) {
        await cssConstant(jData.css);
      };
      if (jData.css.common) {
        await cssCommon(jData.css);
      }
    };
    if (jData.script.constant) {
      await scriptConstant(jData.script)
    }
    if (jData.script.common) {
      await scriptCommon(jData.script)
    }
  })
  async function scriptCommon(data){
    const pathname = window.location.pathname
    const directory = pathname.substring(0, pathname.lastIndexOf('/'));
    for(let dir in data.common){
      if(directory.endsWith(dir)){
        for(let scriptPath of data.common[dir]){
          import(scriptPath)
          .then(async module =>{
            const func = module.default
            await func();
          })
        }
      }
    }
  }
  async function scriptConstant(data){
    for(let scriptPath of data.constant){
      import(scriptPath)
      .then(async module =>{
        const func = module.default
        func();
      })
    }
  }
  async function constantData(data) {
    for (let constKey in data) {''
      await getSetData(data[constKey].from, data[constKey].to);
    }
  }
  async function uniqueData(data) {
    for (let uniqueKey in data) {
      let CDAlinks = document.querySelectorAll("[cda] a");
      CDAlinks.forEach(cda => {
        cda.addEventListener("click", async (e) => {
          e.preventDefault();
          let url = cda.href;
          history.pushState({}, "", url)
          let from = url.replace(uniqueKey, data[uniqueKey].directory);
          let to = data[uniqueKey].to;
          await getSetData(from, to);
            if (jData.constant) {
              await constantData(jData.constant)
            };
            if (jData.css) {
              if (jData.css.constant) {
                await cssConstant(jData.css);
              };
              if (jData.css.common) {
                await cssCommon(jData.css);
              }
            };
            if (jData.script) {
              await scriptConstant(jData.script)
            }
              if (jData.script.common) {
              await scriptCommon(jData.script)
            }
          if (data[uniqueKey].common) {
            const commons = data[uniqueKey].common;
            let pathname = window.location.pathname
            pathname = pathname.substring(0, pathname.lastIndexOf('/'));
            pathname = pathname.replace(uniqueKey, data[uniqueKey].directory)
            for (let commonFolderKey in commons) {
              if (pathname.endsWith(commonFolderKey)) {
                let directoryPaths = commons[commonFolderKey]
                for (let dir in directoryPaths) {
                  let commonFolderPath = pathname + directoryPaths[dir];
                  await getSetData(commonFolderPath, dir);
                }
              }
            }
          }
        })
      })
    }
  }
  async function cssConstant(data){
    if(data.constant){
      for(let href of data.constant){
        let find = document.querySelector(`[href='${href}']`);
        if(!find){
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = 'text/css';
          link.href = href;
          document.head.appendChild(link);
        }
      }
    }
  }
  async function cssCommon(data){
        const pathname = window.location.pathname
        const directory = pathname.substring(0, pathname.lastIndexOf('/'));
        for (let dir in data.common) {
          if (directory.endsWith(dir)) {
            for (let href of data.common[dir]) {
              let find = document.querySelector(`[href='${href}']`);
              if (!find) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = href;
                document.head.appendChild(link);
              }
            }
          }
        }
  }
  async function setup() {
  try {
    const response = await fetch('/setup.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
async function getSetData(from, to) {
  try {
    const response = await fetch(from);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.text();
    if(jData.t2ml){
      import(jData.t2ml)
      .then(async module => {
        const t2ml = module.default;
        const entityConvert = await convertToEntities(data)
        const markup = await t2ml(entityConvert);
        document.querySelector(to).innerHTML = markup;
      })
      .catch(err => {
        console.error('Failed to load module', err);
      });
    }else{
      document.querySelector(to).innerHTML = data;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
async function convertToEntities(str) {
  const entities = {
    '>': '&gt;',
    '<': '&lt;',
    '&': '&amp;',
    '"': `'`
  };

  return str.replace(/[<>&"]/g, function(char) {
    return entities[char];
  });
}
});
