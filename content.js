// Variables to track state
let isSelectionModeActive = false;
let removedElements = [];
let highlightedElement = null;
let controlPanel = null;
let resizeMode = false;
let resizedElements = new Map(); // Store original sizes of resized elements
let resizeHandles = []; // Store resize handles

// Start the element selection tool
function startElementSelection() {
  if (isSelectionModeActive) return;
  isSelectionModeActive = true;
  
  // Create control panel
  createControlPanel();
  
  // Add mouseover handler to highlight elements
  document.addEventListener('mouseover', handleMouseOver);
  
  // Add click handler to select elements
  document.addEventListener('click', handleElementClick, true);
  
  // Add key handler for escape key
  document.addEventListener('keydown', handleKeyDown);
}

// Create floating control panel
function createControlPanel() {
  // Clean up existing panel if any
  if (controlPanel) {
    document.body.removeChild(controlPanel);
  }
  
  controlPanel = document.createElement('div');
  controlPanel.id = 'element-remover-control-panel';
  controlPanel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 10px;
    z-index: 99999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;
  
  const title = document.createElement('div');
  title.textContent = 'Element Remover';
  title.style.cssText = 'font-weight: bold; margin-bottom: 10px; text-align: center;';
  controlPanel.appendChild(title);
  
  const statusText = document.createElement('div');
  statusText.id = 'element-remover-status';
  statusText.textContent = 'Hover over elements to select';
  statusText.style.cssText = 'margin-bottom: 10px; color: #333;';
  controlPanel.appendChild(statusText);
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; justify-content: space-between; flex-wrap: wrap;';
  
  const modeToggleButton = createButton(resizeMode ? 'Remove Mode' : 'Resize Mode', toggleMode);
  modeToggleButton.id = 'mode-toggle-button';
  modeToggleButton.style.marginBottom = '8px';
  modeToggleButton.style.width = '100%';
  
  const resetButton = createButton('Reset All', resetAllChanges);
  const exitButton = createButton('Exit', exitSelectionMode);
  
  buttonContainer.appendChild(modeToggleButton);
  buttonContainer.appendChild(resetButton);
  buttonContainer.appendChild(exitButton);
  controlPanel.appendChild(buttonContainer);
  
  document.body.appendChild(controlPanel);
  
  // Make sure the panel itself doesn't trigger element selection
  controlPanel.addEventListener('mouseover', (e) => {
    e.stopPropagation();
  });
  
  controlPanel.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// Helper to create a button
function createButton(text, clickHandler) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText = `
    padding: 5px 10px;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    margin: 0 5px;
  `;
  button.addEventListener('click', clickHandler);
  return button;
}

// Handle mouseover events to highlight elements
function handleMouseOver(e) {
  // Ignore the control panel
  if (e.target === controlPanel || controlPanel.contains(e.target)) {
    return;
  }
  
  // Remove previous highlight
  if (highlightedElement) {
    highlightedElement.style.outline = '';
  }
  
  // Highlight current element
  highlightedElement = e.target;
  highlightedElement.style.outline = '2px solid #ff0000';
  
  // Update status text
  const statusText = document.getElementById('element-remover-status');
  if (statusText) {
    statusText.textContent = `Selected: ${getElementDescription(highlightedElement)}`;
  }
  
  // Prevent event bubbling
  e.stopPropagation();
}

// Get a descriptive string for the element
function getElementDescription(element) {
  let description = element.tagName.toLowerCase();
  if (element.id) {
    description += `#${element.id}`;
  } else if (element.className) {
    const classes = Array.from(element.classList).join('.');
    if (classes) {
      description += `.${classes}`;
    }
  }
  return description;
}

// Handle element click to remove or resize it
function handleElementClick(e) {
  // Ignore clicks on the control panel or resize handles
  if (e.target === controlPanel || controlPanel.contains(e.target) || 
      e.target.classList.contains('element-resize-handle')) {
    return;
  }
  
  const targetElement = e.target;
  
  if (resizeMode) {
    // In resize mode, add resize handles to the element
    if (targetElement.tagName.toLowerCase() === 'div' || 
        targetElement.style.display === 'block' || 
        getComputedStyle(targetElement).display === 'block') {
      
      // Save original size if not already saved
      if (!resizedElements.has(targetElement)) {
        const computedStyle = getComputedStyle(targetElement);
        resizedElements.set(targetElement, {
          width: targetElement.style.width || computedStyle.width,
          height: targetElement.style.height || computedStyle.height,
          position: targetElement.style.position || computedStyle.position
        });
        
        // Make sure the element has position for proper resize handle placement
        if (['static', ''].includes(getComputedStyle(targetElement).position)) {
          targetElement.style.position = 'relative';
        }
      }
      
      // Remove existing resize handles on this element if any
      removeResizeHandles();
      
      // Add resize handles
      addResizeHandlesToElement(targetElement);
      
      // Update status
      const statusText = document.getElementById('element-remover-status');
      if (statusText) {
        statusText.textContent = `Resizing: ${getElementDescription(targetElement)}`;
      }
    } else {
      // Element can't be resized
      const statusText = document.getElementById('element-remover-status');
      if (statusText) {
        statusText.textContent = `Can't resize ${targetElement.tagName.toLowerCase()} elements. Try a div.`;
      }
    }
  } else {
    // Remove mode - original functionality
    // Store element for potential reset
    const elementToRemove = targetElement;
    const parent = elementToRemove.parentNode;
    const nextSibling = elementToRemove.nextSibling;
    
    // Save for restoration
    removedElements.push({
      element: elementToRemove,
      parent: parent,
      nextSibling: nextSibling
    });
    
    // Hide the element
    parent.removeChild(elementToRemove);
    
    // Update status
    const statusText = document.getElementById('element-remover-status');
    if (statusText) {
      statusText.textContent = `Removed: ${getElementDescription(elementToRemove)}`;
    }
  }
  
  // Prevent event bubbling and default action
  e.preventDefault();
  e.stopPropagation();
}

// Handle keydown events for Escape key
function handleKeyDown(e) {
  if (e.key === 'Escape') {
    exitSelectionMode();
  }
}

// Reset all changes made by restoring removed elements and resized elements
function resetAllChanges() {
  // Restore all removed elements
  while (removedElements.length > 0) {
    const item = removedElements.pop();
    if (item.nextSibling) {
      item.parent.insertBefore(item.element, item.nextSibling);
    } else {
      item.parent.appendChild(item.element);
    }
  }
  
  // Reset all resized elements to original sizes
  resizedElements.forEach((originalStyles, element) => {
    element.style.width = originalStyles.width;
    element.style.height = originalStyles.height;
    element.style.position = originalStyles.position;
  });
  
  // Clear the resized elements map
  resizedElements.clear();
  
  // Remove any active resize handles
  removeResizeHandles();
  
  // Update status
  const statusText = document.getElementById('element-remover-status');
  if (statusText) {
    statusText.textContent = 'All elements restored';
  }
}

// Exit selection mode and clean up
function exitSelectionMode() {
  isSelectionModeActive = false;
  
  // Remove event listeners
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('click', handleElementClick, true);
  document.removeEventListener('keydown', handleKeyDown);
  
  // Remove highlight from current element
  if (highlightedElement) {
    highlightedElement.style.outline = '';
    highlightedElement = null;
  }
  
  // Remove resize handles
  removeResizeHandles();
  
  // Remove control panel
  if (controlPanel && controlPanel.parentNode) {
    controlPanel.parentNode.removeChild(controlPanel);
    controlPanel = null;
  }
}

// Toggle between remove and resize modes
function toggleMode() {
  resizeMode = !resizeMode;
  
  // Update button text
  const modeToggleButton = document.getElementById('mode-toggle-button');
  if (modeToggleButton) {
    modeToggleButton.textContent = resizeMode ? 'Remove Mode' : 'Resize Mode';
  }
  
  // Update status text
  const statusText = document.getElementById('element-remover-status');
  if (statusText) {
    statusText.textContent = resizeMode ? 
      'Resize Mode: Click on a div to resize it' : 
      'Remove Mode: Click on elements to remove them';
  }
  
  // Remove any active resize handles when switching to remove mode
  if (!resizeMode) {
    removeResizeHandles();
  }
}

// Add resize handles to a selected element
function addResizeHandlesToElement(element) {
  // Define handle positions
  const handlePositions = [
    { cursor: 'e-resize', position: 'right', x: '100%', y: '50%', width: '-5px', height: '50%' },
    { cursor: 'w-resize', position: 'left', x: '0%', y: '50%', width: '-5px', height: '50%' },
    { cursor: 's-resize', position: 'bottom', x: '50%', y: '100%', width: '50%', height: '-5px' },
    { cursor: 'n-resize', position: 'top', x: '50%', y: '0%', width: '50%', height: '-5px' },
    { cursor: 'se-resize', position: 'bottom-right', x: '100%', y: '100%', width: '-10px', height: '-10px' },
    { cursor: 'sw-resize', position: 'bottom-left', x: '0%', y: '100%', width: '-10px', height: '-10px' },
    { cursor: 'ne-resize', position: 'top-right', x: '100%', y: '0%', width: '-10px', height: '-10px' },
    { cursor: 'nw-resize', position: 'top-left', x: '0%', y: '0%', width: '-10px', height: '-10px' }
  ];
  
  // Create and attach handles
  handlePositions.forEach(handleData => {
    const handle = document.createElement('div');
    handle.classList.add('element-resize-handle');
    handle.dataset.position = handleData.position;
    handle.dataset.targetElement = element.tagName + (element.id ? '#' + element.id : '');
    
    handle.style.cssText = `
      position: absolute;
      background-color: #4285f4;
      z-index: 99999;
      cursor: ${handleData.cursor};
      width: 10px;
      height: 10px;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      top: ${handleData.y};
      left: ${handleData.x};
      margin-left: ${handleData.width.includes('-') ? handleData.width : '0'};
      margin-top: ${handleData.height.includes('-') ? handleData.height : '0'};
    `;
    
    // Add resize event handling
    handle.addEventListener('mousedown', startResize);
    
    // Add the handle to the page and track it
    document.body.appendChild(handle);
    resizeHandles.push(handle);
  });
}

// Remove all resize handles
function removeResizeHandles() {
  resizeHandles.forEach(handle => {
    if (handle.parentNode) {
      handle.parentNode.removeChild(handle);
    }
  });
  resizeHandles = [];
}

// Start the resize operation
function startResize(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const handle = e.target;
  const position = handle.dataset.position;
  const targetSelector = handle.dataset.targetElement;
  
  // Find the target element
  let targetElement = null;
  if (targetSelector.includes('#')) {
    const [tag, id] = targetSelector.split('#');
    targetElement = document.getElementById(id);
  } else {
    // This is a simplified approach - in a real extension,
    // you might want a more robust way to identify the target
    targetElement = document.querySelector(targetSelector);
  }
  
  if (!targetElement) {
    console.error('Target element not found');
    return;
  }
  
  // Initial dimensions
  const initialRect = targetElement.getBoundingClientRect();
  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = initialRect.width;
  const startHeight = initialRect.height;
  
  // Resize function
  function performResize(e) {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    let newWidth = startWidth;
    let newHeight = startHeight;
    
    // Update dimensions based on handle position
    if (position.includes('right')) {
      newWidth = startWidth + deltaX;
    } else if (position.includes('left')) {
      newWidth = startWidth - deltaX;
    }
    
    if (position.includes('bottom')) {
      newHeight = startHeight + deltaY;
    } else if (position.includes('top')) {
      newHeight = startHeight - deltaY;
    }
    
    // Apply minimum dimensions
    newWidth = Math.max(10, newWidth);
    newHeight = Math.max(10, newHeight);
    
    // Update element size
    targetElement.style.width = `${newWidth}px`;
    targetElement.style.height = `${newHeight}px`;
  }
  
  // Finish resize function
  function finishResize() {
    document.removeEventListener('mousemove', performResize);
    document.removeEventListener('mouseup', finishResize);
    
    // Reposition handles after resize
    removeResizeHandles();
    addResizeHandlesToElement(targetElement);
  }
  
  // Add event listeners for the resize operation
  document.addEventListener('mousemove', performResize);
  document.addEventListener('mouseup', finishResize);
}

// Start the selection tool immediately when script is injected
startElementSelection();