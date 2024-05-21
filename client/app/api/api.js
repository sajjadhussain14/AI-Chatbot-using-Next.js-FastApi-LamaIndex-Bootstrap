const endpoint = "http://localhost:8000";


const handleDeleteFile = async (fileName, fileId) => {
    try {
        await deleteFile(fileName);
        const row = document.getElementById(`file-${fileId}`);
        if (row) {
            row.remove();
        }

    } catch (error) {
        console.error('Failed to delete file:', error);

    }
};
const fillFilesData = (files) => {
    const tbody = document.getElementById('files-table-body');
    tbody.innerHTML = ''; // Clear existing table rows
    files.forEach((file) => {
        const row = document.createElement('tr');
        row.id = `file-${file.id}`;

        const th = document.createElement('th');
        th.scope = 'row';
        th.textContent = file.id;

        const tdName = document.createElement('td');
        tdName.textContent = file.name;

        const tdCreatedAt = document.createElement('td');
        tdCreatedAt.textContent = file.created_at;

        const tdActions = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.textContent = 'X';
        deleteButton.onclick = async () => {
            await handleDeleteFile(file.name, file.id);
            row.remove();
        };

        tdActions.appendChild(deleteButton);

        row.appendChild(th);
        row.appendChild(tdName);
        row.appendChild(tdCreatedAt);
        row.appendChild(tdActions);

        tbody.appendChild(row);
    });
};
export const saveUrlsContent = async (urls) => {
    const responses = [];
    for (const url of urls) {
        try {
            const response = await fetch(`${endpoint}/save?url=${encodeURIComponent(url)}`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            responses.push(data);
            let files = await displayFiles();

            fillFilesData(files)

            console.log(files)
        } catch (error) {
            console.error('Failed to save URL content:', error);
        }
    }
    return responses;
};

export const saveTextAsFile = async (text) => {

    let res = ''
    try {
        const response = await fetch(`${endpoint}/save-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let files = await displayFiles();

        fillFilesData(files)

        res = await response.json();


    } catch (error) {
        console.error('Failed to save text as file:', error);
        throw error;
    }
    return res;
};

export const uploadFiles = async (formData) => {
    let res =""
    try {
        const response = await fetch(`${endpoint}/upload-files`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        res = await response.json();
        let files = await displayFiles();

        fillFilesData(files)

        return res
    } catch (error) {
        console.error('Failed to upload files:', error);
        throw error;
    }
};

export const fetchFiles = async () => {

    console.log('aaaa', `${endpoint}/list-files`)

    try {
        const response = await fetch(`${endpoint}/list-files`);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch files:', error);
        throw error;
    }
};

export const deleteFile = async (fileName) => {
    try {
        const response = await fetch(`${endpoint}/delete-file/${fileName}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to delete file ${fileName}:`, error);
        throw error;
    }
};

export const deleteAllFiles = async () => {
    try {
        const files = await fetchFiles();
        const responses = [];
        for (const file of files) {
            const response = await deleteFile(file.name);
            responses.push(response);
        }
        return responses;
    } catch (error) {
        console.error('Failed to delete all files:', error);
        throw error;
    }
};

export const ingestAllData = async () => {
    try {
        const response = await fetch(`${endpoint}/ingest-all`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to ingest all data:', error);
        throw error;
    }
};

export const deleteAllIngestions = async () => {
    try {
        const response = await fetch(`${endpoint}/delete-all-ingestions`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to delete all ingestions:', error);
        throw error;
    }
};

export const checkIngestionStatus = async () => {
    try {
        const response = await fetch(`${endpoint}/check-ingestion`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to check ingestion status:', error);
        throw error;
    }
};



export const displayFiles = async () => {
    const files = await fetchFiles();
    return files.map((file, index) => ({
        id: index + 1,
        name: file.name,
        created_at: file.created_at,
    }));
};



// Function to show loader
export const showLoader = () => {
    const loaderContainer = document.getElementById('loaderContainer');
    loaderContainer.style.visibility = 'visible';
    loaderContainer.style.opacity = '1';
  };

  // Function to hide loader
  export const hideLoader = () => {
    const loaderContainer = document.getElementById('loaderContainer');
    loaderContainer.style.visibility = 'hidden';
    loaderContainer.style.opacity = '0';
  };