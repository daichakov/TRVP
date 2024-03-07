import Courier from './Courier';
import AppModel from '../model/AppModel'


export default class App {
	#couriers = [];
	#stops = ['1 остановка', '2 остановка', '3 остановка', '4 остановка'];

	onEscapeKeydown = (event) => {
		if (event.key === 'Escape') {
			const input = document.querySelector('.courier-adder__input');
			input.style.display = 'none';
			input.value = '';

			document.querySelector('.courier-adder__btn')
			.style.display = 'inherit';
		}
	};

	// onInputKeydown = async (event) => {
	// 	if (event.key !== 'Enter') return;

	// 	if (event.target.value) {
	// 		const courierID = crypto.randomUUID()

	// 		try {
	// 			const addCourierResult = await AppModel.addCourier({
	// 			courierID,
	// 			name: event.target.value,
	// 			})

	// 			const newCourier = new Courier({
	// 				courierID,
	// 				name: event.target.value,
	// 				onDropTaskInCourier: this.onDropTaskInCourier,
	// 				addNotification: this.addNotification
	// 			})

	// 			this.#couriers.push(newCourier)
	// 			newCourier.render()
				
	// 			this.addNotification({text: addCourierResult.message, type: 'success'})
	// 		} catch(err) {
	// 			this.addNotification({text: err.message, type: 'error'})
	// 			console.error(err)
	// 		}
	// 	}

	// 	event.target.style.display = 'none';
	// 	event.target.value = '';

	// 	document.querySelector('.courier-adder__btn')
	// 	.style.display = 'inherit';
	// };

	onDropTaskInCourier = async (evt) => {
		evt.stopPropagation();

		const destCourierElement = evt.currentTarget;
		destCourierElement.classList.remove('courier_droppable');

		const movedTaskID = localStorage.getItem('movedTaskID');
		const srcCourierID = localStorage.getItem('srcCourierID');
		const destCourierID = destCourierElement.getAttribute('id');

		localStorage.setItem('movedTaskID', '');
		localStorage.setItem('srcCourierID', '');

		if (!destCourierElement.querySelector(`[id="${movedTaskID}"]`)) return;

		const srcCourier = this.#couriers.find(courier => courier.courierID === srcCourierID);
		const destCourier = this.#couriers.find(courier => courier.courierID === destCourierID);
		const fTask = srcCourier.getTaskById({taskID: movedTaskID})
		let flag = false
		let count = 0
		for (let task of destCourier.tasks) {
			if (task.index === fTask.index) {
				count += 1
				break
			}
		}
		if (count > 2) {
			flag = true
		}
		
		const orderedTasksIDs = Array.from(
			document.querySelector(`[id="${destCourierID}"] .courier__tasks-list`).children,
			elem => elem.getAttribute('id')
		);
		
		let prev_ind = -1
		orderedTasksIDs.forEach((taskID, position) => {
			let task = destCourier.tasks.find(task => task.taskID === taskID)
			if (!task) { task = fTask }
			if (prev_ind >= task.taskIndex) {
				// if (task.taskIndex != destCourier.tasks[0].taskIndex) {
					flag = true
				// }
				
			}
			prev_ind = task.taskIndex
			console.log(prev_ind)
		})
		console.log(flag)
		if (!flag) {
			try {
				if (srcCourierID !== destCourierID) {
					await AppModel.moveTask({ taskID: movedTaskID, srcCourierID, destCourierID })

					const movedTask = srcCourier.deleteTask({ taskID: movedTaskID });
					destCourier.pushTask({ task: movedTask });

					srcCourier.reorderTasks();
				}
				destCourier.reorderTasks()

				this.addNotification({text: `Остановка ${movedTaskID} перемещена между маршрутами`, type: 'success'})
			} catch(err) {
				this.addNotification({text: err.message, type: 'error'})
				console.error(err)
			}
		} else {
			alert('Нельзя переместить остановку в данное место')
			location.reload()
			this.addNotification({text: 'Нельзя переместить остановку в данное место', type: 'error'})
		}
	};
// Rework
	editCourier = async ({ courierID, newName}) => {
		let fCourier = null;
		fCourier = this.#couriers.find(courier => courier.courierID === courierID);

		const curCourierName = fCourier.name;

		if (!curCourierName || newName === curCourierName) return;

		try {
			const updateCourierResult = await AppModel.updateCourier({courierID, name: newName})

			fCourier.name = newName
			
			document.querySelector(`[id="${courierID}"] span.courier__name`).innerHTML = newName;
		} catch(err) {
			this.addNotification({text: err.message, type: 'error'})
			console.error(err)
		}
	};

	deleteTask = async ({ taskID }) => {
		let fTask = null;
		let fCourier = null;
		for (let courier of this.#couriers) {
			fCourier = courier;
			fTask = courier.getTaskById({ taskID });
			if (fTask) break;
		}

		try {
			const deleteTaskResult = await AppModel.deleteTask({ taskID })
			fCourier.deleteTask({ taskID })
			document.getElementById(taskID).remove();
			this.addNotification({text: deleteTaskResult.message, type: 'success'})
		} catch(err) {
			this.addNotification({text: err.message, type: 'error'})
			console.error(err)
		}
	};

	initAddCourierModal() {
		const AddCourierModal = document.getElementById('modal-add-courier')

		const cancelHandler = () => {
			AddCourierModal.close()
			AddCourierModal.querySelector('.app-modal__input').value = ''
		}

		const okHandler = async () => {
			const courierID = crypto.randomUUID()
			const modalInput = document.getElementById('modal-add-courier-input')
			if (modalInput.value) {
				try {
					const addCourierResult = await AppModel.addCourier({
						courierID,
						name: modalInput.value,
					})
	
					const newCourier = new Courier({
						courierID,
						name: modalInput.value,
						onDropTaskInCourier: this.onDropTaskInCourier,
						addNotification: this.addNotification
					})
	
					this.#couriers.push(newCourier)
					newCourier.render()
					
					this.addNotification({text: addCourierResult.message, type: 'success'})
				} catch(err) {
					this.addNotification({text: err.message, type: 'error'})
					console.error(err)
				}
			}
			cancelHandler()
		}

		AddCourierModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler)
		AddCourierModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler)
		AddCourierModal.addEventListener('close', cancelHandler)
	}

	initAddTaskModal() {
		const addTaskModal = document.getElementById('modal-add-task')

		const cancelHandler = () => {
			addTaskModal.close()
			localStorage.setItem('addTaskCourierID', '')
		}

		const okHandler = () => {
			const courierID = localStorage.getItem('addTaskCourierID')
			const modalSelector = document.getElementById('modal-add-task-selector')
			const courier = this.#couriers.find(courier => courier.courierID === courierID)
			console.log(courier.tasks)
			if (courier.tasks.length > 0) {
				if (courier.tasks[courier.tasks.length - 1].taskIndex < modalSelector.value + 1 || courier.tasks[0].taskIndex == modalSelector.value) { 
					this.#couriers.find(courier => courier.courierID === courierID).appendNewTask({text: String(this.#stops[modalSelector.value - 1]), position: courier.tasks.length + 1, index: modalSelector.value})
				} else {
					this.addNotification({text: 'Невозможно добавить остановку'})
				}
			} else {
				this.#couriers.find(courier => courier.courierID === courierID).appendNewTask({text: String(this.#stops[modalSelector.value - 1]), position: courier.tasks.length + 1, index: modalSelector.value})
			}
			cancelHandler()
		}

		addTaskModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler)
		addTaskModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler)
		addTaskModal.addEventListener('close', cancelHandler)
	}

	initEditCourierModal() {
		const editCourierModal = document.getElementById('modal-edit-courier')

		const cancelHandler = () => {
			editCourierModal.close()
			localStorage.setItem('editTaskID', '')
			editCourierModal.querySelector('.app-modal__input').value = ''
		}

		const okHandler = () => {
			const courierID = localStorage.getItem('editCourierID')
			const modalInput = document.getElementById('modal-edit-courier-input')
			if (courierID && modalInput.value) {
				this.editCourier({courierID, newName: modalInput.value})
			}
			cancelHandler()
		}

		editCourierModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
		editCourierModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
		editCourierModal.addEventListener('close', cancelHandler)
	}

	initDeleteTaskModal() {
		const deleteTaskModal = document.getElementById('modal-delete-task')

		const cancelHandler = () => {
			deleteTaskModal.close()
			localStorage.setItem('deleteTaskID', '')
		}

		const okHandler = () => {
			const taskID = localStorage.getItem('deleteTaskID')

			if (taskID) {
				this.deleteTask({taskID})

			}
			cancelHandler()
		}

		deleteTaskModal.querySelector('.modal-ok-btn').addEventListener('click', okHandler);
		deleteTaskModal.querySelector('.modal-cancel-btn').addEventListener('click', cancelHandler);
		deleteTaskModal.addEventListener('close', cancelHandler)
	}

	initNotifications() {
		const notifications = document.getElementById('app-notifications')
		notifications.show()

	}

	addNotification = ({ text, type }) => {
		const notifications = document.getElementById('app-notifications')

		const notificationID = crypto.randomUUID()
		const notification = document.createElement('div')
		notification.classList.add(
			'notification',
			type === 'success' ? 'notification-success' : 'notification-error'
		)
		notification.setAttribute('id', notificationID)
		notification.innerHTML = text

		notifications.appendChild(notification)

		setTimeout(() => { document.getElementById(notificationID).remove()}, 5000)
	}

	async init() {
		document.querySelector('.courier-adder__btn')
		.addEventListener(
			'click',
			(event) => {
				document.getElementById('modal-add-courier').showModal()
				// event.target.style.display = 'none';

				// // const input = document.querySelector('.courier-adder__input');
				// input.style.display = 'inherit';
				// input.focus();
			}
		);

		document.addEventListener('keydown', this.onEscapeKeydown);

		// document.querySelector('.courier-adder__input')
		// 	.addEventListener('keydown', this.onInputKeydown);

		// document.getElementById('theme-switch')
		// 	.addEventListener('change', (evt) => {
		// 		(evt.target.checked
		// 			? document.body.classList.add('dark-theme')
		// 			: document.body.classList.remove('dark-theme'));
		// });

		this.initAddTaskModal()
		this.initEditCourierModal()
		this.initDeleteTaskModal()
		this.initNotifications()
		this.initAddCourierModal()

		document.addEventListener('dragover', (evt) => {
			evt.preventDefault();

			const draggedElement = document.querySelector('.task.task_selected');
			const draggedElementPrevList = draggedElement.closest('.courier');

			const currentElement = evt.target;
			const prevDroppable = document.querySelector('.courier_droppable');
			let curDroppable = evt.target;
			while (!curDroppable.matches('.courier') && curDroppable !== document.body) {
				curDroppable = curDroppable.parentElement;
			}

			if (curDroppable !== prevDroppable) {
				if (prevDroppable) prevDroppable.classList.remove('courier_droppable');

				if (curDroppable.matches('.courier')) {
					curDroppable.classList.add('courier_droppable');
				}
			}

			if (!curDroppable.matches('.courier') || draggedElement === currentElement) return;

			if (curDroppable === draggedElementPrevList) {
				if (!currentElement.matches('.task')) return;

				const nextElement = (currentElement === draggedElement.nextElementSibling)
					? currentElement.nextElementSibling
					: currentElement;

				curDroppable.querySelector('.courier__tasks-list')
					.insertBefore(draggedElement, nextElement);

				return;
			}

			if (currentElement.matches('.task')) {
				curDroppable.querySelector('.courier__tasks-list')
					.insertBefore(draggedElement, currentElement);

				return;
			}

			if (!curDroppable.querySelector('.courier__tasks-list').children.length) {
				curDroppable.querySelector('.courier__tasks-list')
					.appendChild(draggedElement);
			}
		});
		try {
			const couriers = await AppModel.getCouriers()
			for (const courier of couriers) {
				const courierObj = new Courier({
					courierID: courier.courierID,
					name: courier.name,
					onDropTaskInCourier: this.onDropTaskInCourier,
					addNotification: this.addNotification
				})

				this.#couriers.push(courierObj)
				courierObj.render()

				for (const task of courier.tasks) {
					courierObj.addNewTaskLocal({
						taskID: task.taskID,
						text: task.text,
						position: task.position,
						index: task.ind
					})
					console.log(task.ind)
				}
			}
		} catch(error) {
			this.addNotification({text: error.message, type: 'error'})
			console.error(error)
		}
	}
};
