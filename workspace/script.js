document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const videoElement = document.getElementById('video-stream');
    const startStreamBtn = document.getElementById('start-stream');
    const stopStreamBtn = document.getElementById('stop-stream');
    const toggleCameraBtn = document.getElementById('toggle-camera');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const viewerCountElement = document.getElementById('viewers');
    const commentsContainer = document.getElementById('comments-container');
    const commentInput = document.getElementById('comment-input');
    const usernameInput = document.getElementById('username');
    const sendCommentBtn = document.getElementById('send-comment');
    const generateKeyBtn = document.getElementById('generate-key');
    const keyDisplay = document.getElementById('key-display');
    const permissionOverlay = document.getElementById('permission-overlay');
    const requestPermissionBtn = document.getElementById('request-permission');
    const instructionsOverlay = document.getElementById('instructions-overlay');
    const closeInstructionsBtn = document.getElementById('close-instructions');
    const showInstructionsBtn = document.getElementById('show-instructions');

    // Stream variables
    let stream = null;
    let mediaRecorder = null;
    let isStreaming = false;
    let cameraMode = 'user'; // front camera by default
    let streamKey = '';
    let viewerCount = 0;
    let commentCount = 0;
    let mockInterval = null;

    // Check if username is saved in localStorage
    if (localStorage.getItem('streamUsername')) {
        usernameInput.value = localStorage.getItem('streamUsername');
    }

    // Show instructions on first visit
    if (!localStorage.getItem('instructionsViewed')) {
        instructionsOverlay.style.display = 'flex';
        localStorage.setItem('instructionsViewed', 'true');
    } else {
        instructionsOverlay.style.display = 'none';
    }

    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support camera access. Please use a modern browser.');
        permissionOverlay.style.display = 'flex';
        requestPermissionBtn.disabled = true;
        return;
    }

    // Request camera permissions
    function requestCameraPermission() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraMode }, audio: true })
            .then(mediaStream => {
                stream = mediaStream;
                videoElement.srcObject = stream;
                permissionOverlay.style.display = 'none';
                startStreamBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error accessing camera:', error);
                alert('Could not access camera. Please grant permission and try again.');
            });
    }

    // Toggle between front and back cameras
    function toggleCamera() {
        if (!stream) return;
        
        // Stop all tracks on the current stream
        stream.getTracks().forEach(track => track.stop());
        
        // Switch camera mode
        cameraMode = cameraMode === 'user' ? 'environment' : 'user';
        
        // Get new stream with different camera
        navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraMode }, audio: true })
            .then(mediaStream => {
                stream = mediaStream;
                videoElement.srcObject = stream;
            })
            .catch(error => {
                console.error('Error switching camera:', error);
                alert('Failed to switch camera. Your device may only have one camera.');
                
                // Revert to previous mode if failed
                cameraMode = cameraMode === 'user' ? 'environment' : 'user';
                
                // Try to get the original stream back
                navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraMode }, audio: true })
                    .then(mediaStream => {
                        stream = mediaStream;
                        videoElement.srcObject = stream;
                    });
            });
    }

    // Start the stream
    function startStream() {
        if (!stream) return;
        
        // In a real app, this would connect to a streaming server
        // Here we'll just simulate streaming for demo purposes
        isStreaming = true;
        startStreamBtn.disabled = true;
        stopStreamBtn.disabled = false;
        toggleCameraBtn.disabled = false;
        statusIndicator.className = 'status-live';
        statusText.textContent = 'Live';

        // Generate a mock stream key if not already generated
        if (!streamKey) {
            generateStreamKey();
        }

        // Simulate increasing viewer count
        mockInterval = setInterval(() => {
            if (Math.random() > 0.5) {
                viewerCount += Math.floor(Math.random() * 3) + 1;
                viewerCountElement.textContent = viewerCount;
            }
        }, 5000);

        // Add system comment that stream has started
        addSystemComment('Stream has started');
    }

    // Stop the stream
    function stopStream() {
        isStreaming = false;
        startStreamBtn.disabled = false;
        stopStreamBtn.disabled = true;
        statusIndicator.className = 'status-offline';
        statusText.textContent = 'Offline';
        
        // Clear mock viewer interval
        if (mockInterval) {
            clearInterval(mockInterval);
            mockInterval = null;
        }

        // Add system comment that stream has ended
        addSystemComment('Stream has ended');
        
        // Reset viewer count after a short delay
        setTimeout(() => {
            viewerCount = 0;
            viewerCountElement.textContent = viewerCount;
        }, 3000);
    }

    // Generate a random stream key
    function generateStreamKey() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        streamKey = result;
        keyDisplay.textContent = streamKey;
    }

    // Add a comment to the comments container
    function addComment(username, text, isSystem = false) {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        if (isSystem) {
            commentElement.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
        }
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-user">${isSystem ? 'System' : username}</span>
                <span class="comment-time">${timeStr}</span>
            </div>
            <div class="comment-text">${text}</div>
        `;
        
        commentsContainer.appendChild(commentElement);
        commentsContainer.scrollTop = commentsContainer.scrollHeight;
        
        // Increment comment count for IDs
        commentCount++;
        
        // Auto-delete comments if there are too many (for performance)
        if (commentsContainer.children.length > 100) {
            commentsContainer.removeChild(commentsContainer.children[0]);
        }
    }

    // Add a system comment
    function addSystemComment(text) {
        addComment('System', text, true);
    }

    // Event Listeners
    requestPermissionBtn.addEventListener('click', requestCameraPermission);
    startStreamBtn.addEventListener('click', startStream);
    stopStreamBtn.addEventListener('click', stopStream);
    toggleCameraBtn.addEventListener('click', toggleCamera);
    
    generateKeyBtn.addEventListener('click', () => {
        generateStreamKey();
        addSystemComment('A new stream key has been generated');
    });
    
    sendCommentBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim() || 'Anonymous';
        const commentText = commentInput.value.trim();
        
        if (commentText) {
            addComment(username, commentText);
            commentInput.value = '';
            
            // Save username to localStorage
            localStorage.setItem('streamUsername', username);
        }
    });
    
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendCommentBtn.click();
        }
    });
    
    closeInstructionsBtn.addEventListener('click', () => {
        instructionsOverlay.style.display = 'none';
    });
    
    showInstructionsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        instructionsOverlay.style.display = 'flex';
    });

    // Initial setup - show permission overlay
    permissionOverlay.style.display = 'flex';
    startStreamBtn.disabled = true;
    stopStreamBtn.disabled = true;

    // Add some initial system comments for better UX
    setTimeout(() => {
        addSystemComment('Welcome to the live stream app!');
        addSystemComment('Grant camera permission to start streaming');
    }, 1000);

    // Mock comments for demo purposes (when streaming)
    function addMockComments() {
        if (!isStreaming) return;
        
        const mockUsers = ['Viewer123', 'StreamFan', 'MobileUser', 'WebExplorer', 'TechGuru'];
        const mockComments = [
            'Great stream!',
            'Hello from New York!',
            'What camera are you using?',
            'The quality looks amazing',
            'Can you show that again?',
            'First time watching, loving the content',
            'Hello everyone in the chat',
            'Just joined, what did I miss?'
        ];
        
        if (Math.random() > 0.7) {
            const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
            const randomComment = mockComments[Math.floor(Math.random() * mockComments.length)];
            addComment(randomUser, randomComment);
        }
    }
    
    // Add mock comments every 8-15 seconds
    setInterval(addMockComments, Math.random() * 7000 + 8000);
});