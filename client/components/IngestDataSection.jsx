"use client"
import React, { useEffect, useState } from 'react';
import { ingestAllData, deleteAllIngestions, checkIngestionStatus,showLoader, hideLoader } from '../app/api/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const IngestDataSection = () => {
    const [ingestionStatus, setIngestionStatus] = useState(false);

    const updateIngestionStatus = async () => {
        const status = await checkIngestionStatus();
        setIngestionStatus(status);
    };

    useEffect(() => {
        updateIngestionStatus();
    }, []);

    const handleIngestAllData = async () => {
        showLoader()
        try {
            await ingestAllData();
            hideLoader()
            toast.success('Data ingestion has been successfully updated!');
            setTimeout(() => {
                window.location.reload()
            }, 3000);
            updateIngestionStatus();
        } catch (error) {
            toast.error('Data ingestion failed!');
        }
        hideLoader()

    };

    const handleDeleteAllIngestions = async () => {
        showLoader()
        try {
            await deleteAllIngestions();
            hideLoader()
            toast.success('Data ingestion deletion was successful!');
            setTimeout(() => {
                window.location.reload()
            }, 3000);
            updateIngestionStatus();
        } catch (error) {
            toast.error('Data ingestion deletion failed!');
        }
        hideLoader()

    };
 
    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h6 className="card-title mb-0">Ingest All Data</h6>
                            <div className="d-flex align-items-center">
                                {ingestionStatus ? (
                                    <span className="ingestion-exist text-success d-flex align-items-center">
                                        Ingestions exist.
                                        <i className="fas fa-check-circle ms-2"></i>
                                    </span>
                                ) : (
                                    <span className="ingestion-not-exist text-danger d-flex align-items-center">
                                        No ingestions available.
                                        <i className="fas fa-times-circle ms-2"></i>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="card-body text-center">
                            <p>Click the button below to trigger the ingestion of all data files</p>
                            <button className="btn btn-outline-primary mx-2" onClick={handleIngestAllData}>
                                Ingest All Data
                            </button>
                            <button
                                className="btn btn-outline-primary mx-2"
                                onClick={handleDeleteAllIngestions}
                                disabled={!ingestionStatus}
                            >
                                Delete All Ingestions
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default IngestDataSection;
