import Task from './Task';
import AppModel from '../model/AppModel';

function UserException(message) {
	this.message = message;
	this.name = "Исключение, определённое пользователем";
}

export default class Courier {
	#tasks = [];
	#courierName = '';
	#courierID = '';

	constructor({
		courierID = null,
		name,
		onDropTaskInCourier,
		addNotification
	}) {
		this.#courierName = name;
		this.#courierID = courierID || crypto.randomUUID();
		this.onDropTaskInCourier = onDropTaskInCourier;
		this.addNotification = addNotification
	}

	get courierID() { return this.#courierID; }

	get name() { return this.#courierName }
	set name(value) { 
		if (typeof value === 'string') {
			this.#courierName = value;
		}
	}

	pushTask = ({ task }) => this.#tasks.push(task);

	getTaskById = ({ taskID }) => this.#tasks.find(task => task.taskID === taskID);

	get tasks() { return this.#tasks }

	deleteTask = ({ taskID }) => {
		const deleteTaskIndex = this.#tasks.findIndex(task => task.taskID === taskID);

		if (deleteTaskIndex === -1) return;

		const [deletedTask] = this.#tasks.splice(deleteTaskIndex, 1);

		return deletedTask;
	};

	reorderTasks = async () => {
		const orderedTasksIDs = Array.from(
			document.querySelector(`[id="${this.#courierID}"] .courier__tasks-list`).children,
			elem => elem.getAttribute('id')
		);

		const reorderedTasksInfo = []

		try {	
			orderedTasksIDs.forEach((taskID, position) => {
				const task = this.#tasks.find(task => task.taskID === taskID)
				if (task.taskPosition != position) {
					task.taskPosition = position
					reorderedTasksInfo.push({taskID, position})
				}
			});
			if (reorderedTasksInfo.length > 0) {
				try {
					await AppModel.updateTasks({reorderedTasks: reorderedTasksInfo})
				} catch(err) {
					this.addNotification({text: err.message, type: 'error'})
					console.error(err)
				}
			}
		} catch (err) {
			// this.addNotification({text: err.message, type: 'error'})
			throw new UserException('Error')
		}
		
	}

	appendNewTask = async ({ text, position, index }) => {
		try {
			const taskID = crypto.randomUUID()
			const addTaskResult = await AppModel.addTask({
				taskID,
				text,
				position,
				index,
				courierID: this.#courierID
			})
			this.addNewTaskLocal({taskID, text, position: this.#tasks.length, index})
			this.addNotification({text: addTaskResult.message, type: 'success'})
		} catch(err) {
			this.addNotification({text: err.message, type: 'error'})
			console.error(err)
		}
	};


	addNewTaskLocal = ({ taskID = null, text, position, index }) => {
		const newTask = new Task({
			taskID,
			text,
			position,
			index
		});
		this.#tasks.push(newTask);

		const newTaskElement = newTask.render();
		document.querySelector(`[id="${this.#courierID}"] .courier__tasks-list`)
			.appendChild(newTaskElement);
	}
// Переработать, вставить значения 
	render() {
		const liElement = document.createElement('li');
		liElement.classList.add(
			'couriers-list__item',
			'courier'
		);
		liElement.setAttribute('id', this.#courierID);
		liElement.addEventListener(
			'dragstart',
			() => localStorage.setItem('srcCourierID', this.#courierID)
		);
		liElement.addEventListener('drop', this.onDropTaskInCourier);
		
		const divElement = document.createElement('div')
		divElement.classList.add('courier-list__item-header')

		const h2Element = document.createElement('span');
		h2Element.classList.add('courier__name');
		h2Element.innerHTML = this.#courierName;
		divElement.appendChild(h2Element);

		const editBtn = document.createElement('button');
		editBtn.setAttribute('type', 'button');
		editBtn.classList.add('courier__edit-btn', 'edit-icon');
		editBtn.addEventListener('click', () => {
			localStorage.setItem('editCourierID', this.#courierID)
			localStorage.setItem('tasksLength', this.#tasks.length)
			document.getElementById('modal-edit-courier').showModal()
		});
		divElement.appendChild(editBtn)
		liElement.appendChild(divElement)

		const innerUlElement = document.createElement('ul');
		innerUlElement.classList.add('courier__tasks-list');
		liElement.appendChild(innerUlElement);

		const button = document.createElement('button');
		button.setAttribute('type', 'button');
		button.classList.add('courier__add-task-btn');
		button.innerHTML = '&#10010; Добавить остановку';
		button.addEventListener('click', () => {
			localStorage.setItem('addTaskCourierID', this.#courierID)
			document.getElementById('modal-add-task').showModal()
		});
		liElement.appendChild(button);

		const adderElement = document.querySelector('.courier-adder');
		adderElement.parentElement.insertBefore(liElement, adderElement);
	}
};
