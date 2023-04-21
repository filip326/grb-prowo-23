/** @type {HTMLDivElement | null} */
const fileDragNDrop = document.querySelector('div#fileDragNDrop');
/** @type {HTMLInputElement | null} */
const fileUpload = document.querySelector('input#fileUpload');
/** @type {HTMLButtonElement | null} */
const displayDataButton = document.querySelector('button#proceedWithData');

const insertedData = {};

fileDragNDrop.innerText = '.xlsx oder .csv Datei hier hinziehen\nKlicken, um Datei zu öffnen';

fileDragNDrop.addEventListener('dragover', (e) => {

    e.preventDefault();

    fileDragNDrop.classList.add('dragover');
    fileDragNDrop.innerText = 'Datei jetzt loslassen';

});

fileDragNDrop.addEventListener('dragleave', (e) => {

    fileDragNDrop.classList.remove('dragover')
    if (Object.keys(insertedData).length === 0)
        fileDragNDrop.innerText = '.xlsx oder .csv Datei hier hinziehen\nKlicken, um Datei zu öffnen';
    else
        fileDragNDrop.innerText = 'Eingefügt:\n' + Object.keys(insertedData).map(name => `- ${name}`).join('\n') + '\nWeitere Dateien hier hinziegen oder klicken, um Datei zu öffnen';

});

fileDragNDrop.addEventListener('drop', (e) => {

    e.preventDefault();

    fileDragNDrop.classList.remove('dragover');
    fileDragNDrop.innerText = 'Prüfe Datei...';

    const files = e.dataTransfer.files;

    checkFiles(files);
    
});

fileDragNDrop.addEventListener('click', async (e) => {
    const fileHandlers = (await window.showOpenFilePicker());
    const files = []
    for await (const file of fileHandlers) {
        files.push(await file.getFile());
    }
    checkFiles(files);
});

/**
 * @param {File[]} files 
 */
function checkFiles(files) {
    for (let file of files) {

        // excel sheet
        if (file.name.endsWith('.xlsx') && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            fileDragNDrop.innerText = 'Excel Datei erkannt';
            continueWithExcelFile(file);
            continue;
        }

        // csv file
        if (file.name.endsWith('.csv') && file.type === 'text/csv') {
            fileDragNDrop.innerText = 'CSV Datei erkannt';
            continueWithCsvFile(file);
            continue;
        }

        // invalid file type
        fileDragNDrop.innerText = 'Datei nicht erkannt oder ungültig';
    }
}

/**
 * @param {File} file 
 */
async function continueWithExcelFile(file) {
    const fileReader = new FileReader();

    fileReader.readAsArrayBuffer(file)

    fileReader.addEventListener('load', async (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            insertedData[`${file.name}/${sheetName}`] = sheetData.map((row) => row.map(cell => String(cell)));
        });

        fileDragNDrop.innerText = 'Eingefügt:\n' + Object.keys(insertedData).map(name => `- ${name}`).join('\n');
    })
}
/**
 * @param {File} file 
 */
async function continueWithCsvFile(file) {
    const fileReader = new FileReader();

    fileReader.readAsText(file, 'utf-8');

    fileReader.addEventListener('load', async (e) => {
        const data = e.target.result;
        console.log(data);

        // split file into lines
        const lines = data.split('\n');

        // split each line into columns;
        const cells = lines.map(line => line.split(';'));

        insertedData[file.name] = cells;

        fileDragNDrop.innerText = 'Eingefügt:\n' + Object.keys(insertedData).map(name => `- ${name}`).join('\n');
    })

    fileReader.addEventListener('error', (e) => {
        alert('Fehler beim Lesen der Datei');
    });
}

displayDataButton.addEventListener('click', displayData);

function displayData() {
    const sheetNames = Object.keys(insertedData);
    let activeSheet = sheetNames[0];
  
    // Create a sheet selector at the bottom
    const sheetSelector = document.createElement("select");
    sheetNames.forEach((sheetName) => {
      const option = document.createElement("option");
      option.value = sheetName;
      option.text = sheetName;
      sheetSelector.add(option);
    });
    sheetSelector.value = activeSheet;
  
    // Create the table element
    const table = document.createElement("table");
  
    // Create the table rows
    const rows = insertedData[activeSheet];
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((cell) => {
        const td = document.createElement("td");
        td.textContent = cell ?? "";
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
  
    // Attach event listener to sheet selector to switch sheets
    sheetSelector.addEventListener("change", (e) => {
      activeSheet = e.target.value;
      updateTable();
    });
  
    // Function to update the table when the active sheet changes
    function updateTable() {
      // Clear the current table rows
      while (table.rows.length > 0) {
        table.deleteRow(0);
      }
  
      // Update the table rows
      const rows = insertedData[activeSheet];
      rows.forEach((row) => {
        const tr = document.createElement("tr");
        row.forEach((cell) => {
          const td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
    }
  
    // Create a container element for the sheet selector and table
    const container = document.createElement("div");
    container.appendChild(sheetSelector);
    container.appendChild(table);
  
    // clear the body
    document.body.innerHTML = '';
    // Attach the container to the document body
    document.body.appendChild(container);


}
  