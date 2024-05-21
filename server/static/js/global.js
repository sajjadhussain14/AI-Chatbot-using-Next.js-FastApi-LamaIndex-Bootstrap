// SHOW LOADER
const showLoder = () => {
    document.getElementById("spinner").style.visibility = "visible";
    document.getElementById("spinner").style.opacity = 1;
  };
  
  // HIDE LOADER
  const hideLoder = () => {
    document.getElementById("spinner").style.visibility = "hidden";
    document.getElementById("spinner").style.opacity = 0;
  };

  
    // Function to create and show an alert
    function showAlert(type, message,container) {
        // Create alert element
        const alert = document.createElement('div');
        alert.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
    
        // Append alert to container
        const alertContainer = document.getElementById(container);

        try{
        alertContainer.appendChild(alert);
        } catch(err){}
    
        // Dismiss the alert after 4 seconds
        setTimeout(() => {
          alert.classList.add('d-none'); // Hides the alert
        }, 4000);
      }
    