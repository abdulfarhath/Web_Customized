// Store removed elements and applied CSS for resetting
let removedElements = [];

// Function to remove element by class or ID
function removeElementBySelector(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
        removedElements.push(element.outerHTML);  // Save element HTML for reset
        element.remove();
    });
}

// Function to apply custom CSS to element by class or ID
function applyCustomCss(selector, css) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
        element.style.cssText += css;
    });
}

// Event listener for Remove Element button
document.getElementById('removeBtn').addEventListener('click', function() {
    const selector = document.getElementById('removeInput').value;
    if (selector) {
        removeElementBySelector(selector);
    }
});

// Event listener for Apply CSS button
document.getElementById('applyCssBtn').addEventListener('click', function() {
    const selector = document.getElementById('cssTarget').value;
    const css = document.getElementById('cssInput').value;
    if (selector && css) {
        applyCustomCss(selector, css);
    }
});

// Event listener for Reset CSS button
document.getElementById('resetCssBtn').addEventListener('click', function() {
    const selector = document.getElementById('cssTarget').value;
    if (selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.style = ''; // Remove inline styles
        });
    }
});

// Event listener for Reset Removal button
document.getElementById('resetRemoveBtn').addEventListener('click', function() {
    removedElements.forEach(html => {
        const div = document.createElement('div');
        div.innerHTML = html; // Insert back removed element HTML
        document.body.appendChild(div);
    });
    removedElements = [];  // Clear the removed elements list
});
