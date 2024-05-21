"use client"

import React, { useState } from 'react';
import { saveUrlsContent, saveTextAsFile, uploadFiles, showLoader, hideLoader } from '../app/api/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DataSection = ({ displayFiles }) => {
    const [urls, setUrls] = useState('');
    const [text, setText] = useState('');
    const [files, setFiles] = useState(null);

    const handleSaveData = async () => {
        showLoader()
        if (urls) {
            try {
                await saveUrlsContent(urls.split('\n').map(url => url.trim()));
                hideLoader()
                showAlert('URL content has been saved successfully!', 'info');
                setUrls('');
                setTimeout(() => {
                    window.location.reload()
                }, 3000);

            } catch (error) {
                showAlert(`Saving URL content failed. ${error.message}`, 'warning');
            }
        }

        if (text) {
            try {
                await saveTextAsFile(text);
                hideLoader()
                showAlert('Provided content has been saved successfully!', 'info');
                setText('');
                setTimeout(() => {
                    window.location.reload()
                }, 3000);

            } catch (error) {
                showAlert(`Saving provided content failed. ${error.message}`, 'warning');
            }
        }

        if (files) {
            try {
                const formData = new FormData();
                for (let i = 0; i < files.length; i++) {
                    formData.append('files', files[i]);
                }
                await uploadFiles(formData);
                hideLoader()
                showAlert('Files have been uploaded successfully!', 'info');
                setFiles(null);
                setTimeout(() => {
                    window.location.reload()
                }, 3000);

            } catch (error) {
                showAlert(`Uploading files failed. ${error.message}`, 'warning');
            }
        }
        hideLoader()

    };

    const showAlert = (message, type) => {
        toast[type](message, {
            position: "bottom-center",
            autoClose: 3000, // Hide alert after 3 seconds
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    const handleCancelData = () => {
        setUrls('');
        setText('');
        setFiles(null);
    };

    return (
        <div className="container">
            <h6 className="p-2">Import data from here. This will gather all the information from URLs, text, or files and save them into the Data folder as files.</h6>
            <div className="row tighten">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="card-title">Add Data from URLs</h6>
                        </div>
                        <div className="card-body">
                            <textarea
                                className="form-control"
                                value={urls}
                                onChange={(e) => setUrls(e.target.value)}
                                rows="2"
                                placeholder="Enter URLs (one per line)"
                            ></textarea>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="card-title">Add Data As Text</h6>
                        </div>
                        <div className="card-body">
                            <textarea
                                className="form-control"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows="2"
                                placeholder="Enter Text"
                            ></textarea>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row tighten">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="card-title">Upload Files <small>(Text, docx, doc, pdf, Image)</small></h6>
                        </div>
                        <div className="card-body">
                            <input
                                type="file"
                                multiple
                                className="form-control mb-2 no-padding"
                                onChange={(e) => setFiles(e.target.files)}
                            />
                            <div id="upload-response"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="alert-container"></div>
            <div className="row btn-container">
                <div className="col-md-12 text-center mt-3">
                    <button type="button" className="btn btn-outline-primary mx-2" onClick={handleSaveData}>Save Data</button>
                    <button type="button" className="btn btn-outline-primary mx-2" onClick={handleCancelData}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default DataSection;
