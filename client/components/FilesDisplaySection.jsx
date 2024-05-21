"use client"
import React, { useEffect, useState } from 'react';
import { displayFiles, deleteFile, deleteAllFiles, showLoader, hideLoader } from '../app/api/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FilesDisplaySection = () => {
    const [files, setFiles] = useState([]);

    useEffect(() => {
        // Fetch and display files on component mount
        const fetchAndDisplayFiles = async () => {
            // Fetch files from API
            const filesData = await displayFiles();
            setFiles(filesData);
        };

        fetchAndDisplayFiles();
    }, []);

    const handleDeleteFile = async (fileName, fileId) => {
        showLoader()
        try {
            // Attempt to delete the file
            await deleteFile(fileName, fileId);
            // If successful, update the files state and show a success toast
            const updatedFiles = await displayFiles();
            setFiles(updatedFiles);
            hideLoader()
            toast.success('File deleted successfully!');
            setTimeout(() => {
                window.location.reload()
            }, 3000);
        } catch (error) {
            // If deletion fails, show an error toast
            toast.error(`Failed to delete file. ${error.message}`);
        }
        hideLoader()
    };

    const handleDeleteAllFiles = async () => {
        showLoader()
        try {
            // Attempt to delete all files
            await deleteAllFiles();
            // If successful, clear the files state and show a success toast
            setFiles([]);
            hideLoader()
            toast.success('All files deleted successfully!');
            setTimeout(() => {
                window.location.reload()
            }, 3000);
        } catch (error) {
            // If deletion fails, show an error toast
            toast.error(`Failed to delete all files. ${error.message}`);
        }
        hideLoader()
    };

    return (
        <div className="container mt-4">
            {/* File display section */}
            <ToastContainer />
            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="card-title">Uploaded Files</h6>
                        </div>
                        <div className="card-body">
                            <table className="table" id="files-table">
                                <thead>
                                    <tr>
                                        <th scope="col">No</th>
                                        <th scope="col">Filename</th>
                                        <th scope="col">Date Time</th>
                                        <th scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="files-table-body" >
                                    {files.map((file) => (
                                        <tr key={file.id} id={`file-${file.id}`}>
                                            <th scope="row">{file.id}</th>
                                            <td>{file.name}</td>
                                            <td>{file.created_at}</td>
                                            <td>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDeleteFile(file.name, file.id)}
                                                >
                                                    X
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="text-center">
                                <p>Want to delete all files?</p>
                                <div id="alert-container-files"></div>
                                <button className="btn btn-outline-primary" onClick={handleDeleteAllFiles}>
                                    <i className="bi bi-trash"></i> Delete All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilesDisplaySection;
