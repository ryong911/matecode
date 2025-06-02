# Sample LLM Chatbot Response with Code Blocks

Hi there! Here's the implementation of the to-do list application you requested. Let me break it down by files:

## HTML Structure (index.html)

index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Todo App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Todo List</h1>
        <div class="input-container">
            <input type="text" id="task-input" placeholder="Add a new task...">
            <button id="add-button">Add</button>
        </div>
        <ul id="task-list">
            <!-- Tasks will be added here dynamically -->
        </ul>
    </div>
    <script src="app.js"></script>
</body>
</html>
```

## CSS Styling (styles.css)

styles.css
```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
}

body {
    background-color: #f5f5f5;
}

.container {
    max-width: 600px;
    margin: 40px auto;
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
    text-align: center;
    margin-bottom: 20px;
    color: #333;
}

.input-container {
    display: flex;
    margin-bottom: 20px;
}

#task-input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px 0 0 4px;
    outline: none;
}

#add-button {
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
    transition: background-color 0.3s;
}

#add-button:hover {
    background-color: #45a049;
}

#task-list {
    list-style-type: none;
}

.task-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
}

.task-item:last-child {
    border-bottom: none;
}

.task-text {
    flex: 1;
}

.completed {
    text-decoration: line-through;
    color: #888;
}

.delete-btn {
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    margin-left: 10px;
}

.delete-btn:hover {
    background-color: #d32f2f;
}
```

## JavaScript Functionality (app.js)

app.js
```javascript
document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addButton = document.getElementById('add-button');
    const taskList = document.getElementById('task-list');
    
    // Load tasks from local storage
    loadTasks();
    
    // Add task event
    addButton.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;
        
        createTaskElement(taskText);
        
        // Save to local storage
        saveTasks();
        
        // Clear input
        taskInput.value = '';
        taskInput.focus();
    }
    
    function createTaskElement(text, completed = false) {
        const li = document.createElement('li');
        li.className = 'task-item';
        
        const taskTextSpan = document.createElement('span');
        taskTextSpan.className = 'task-text';
        if (completed) taskTextSpan.classList.add('completed');
        taskTextSpan.textContent = text;
        
        // Toggle completion on click
        taskTextSpan.addEventListener('click', () => {
            taskTextSpan.classList.toggle('completed');
            saveTasks();
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            li.remove();
            saveTasks();
        });
        
        li.appendChild(taskTextSpan);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    }
    
    function saveTasks() {
        const tasks = [];
        document.querySelectorAll('.task-item').forEach(item => {
            const text = item.querySelector('.task-text').textContent;
            const completed = item.querySelector('.task-text').classList.contains('completed');
            tasks.push({ text, completed });
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            const tasks = JSON.parse(savedTasks);
            tasks.forEach(task => {
                createTaskElement(task.text, task.completed);
            });
        }
    }
});
```

To use this todo list app:

1. Create the three files above (index.html, styles.css, and app.js) in the same directory.
2. Open index.html in your web browser.
3. Add tasks by typing in the input field and clicking "Add" or pressing Enter.
4. Click on a task to mark it as completed.
5. Click the "Delete" button to remove a task.
6. Your tasks will be saved in the browser's local storage, so they'll persist even when you close the page.

Let me know if you need any clarifications or have any questions about the implementation!