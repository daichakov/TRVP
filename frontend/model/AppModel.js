export default class AppModel {
    static async getCouriers()  {
        try {
            const couriersResponse = await fetch('http://localhost:8080/couriers')
            const couriersBody = await couriersResponse.json()

            if (couriersResponse.status !== 200) {
                return Promise.reject(couriersBody)
            }

            return couriersBody.couriers
        } catch(err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            })
        }
    }

    static async addCourier({courierID, name})  {
        try {
            const addCourierResponse = await fetch('http://localhost:8080/couriers', {
                method: 'POST',
                body: JSON.stringify({courierID, name}),
                headers: {
                    'Content-type': 'application/json'
                }
            })

            if (addCourierResponse.status !== 200) {
                const addCourierBody = await addCourierResponse.json()
                return Promise.reject(addCourierBody)
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Маршрут ${name} был успешно добавлен`
            }
        } catch(err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            })
        }
    }

    static async addTask({taskID, text, position, index, courierID})  {
        try {
            const addTaskResponse = await fetch('http://localhost:8080/tasks', {
                method: 'POST',
                body: JSON.stringify({taskID, text, position, index, courierID}),
                headers: {
                    'Content-type': 'application/json'
                }
            })

            if (addTaskResponse.status !== 200) {
                const addTaskBody = await addTaskResponse.json()
                return Promise.reject(addTaskBody)
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Остановка ${text} была успешно добавлена`
            }
        } catch(err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            })
        }
    }

    static async updateCourier({courierID, name}) {
        try {
            const updateCourierResponse = await fetch(`http://localhost:8080/couriers/${courierID}`, {
                method: 'PATCH',
                body: JSON.stringify({name}),
                headers: {
                    'Content-type': 'application/json'
                }
            })

            if (updateCourierResponse.status !== 200) {
                const updateCourierBody = await updateCourierResponse.json()
                return Promise.reject(updateCourierBody)
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Маршрут ${name} был успешно изменен`
            }
        } catch(err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            })
        }
    }

    static async updateTask({taskID, text, position}) {
        try {
            const updateTaskResponse = await fetch(`http://localhost:8080/tasks/${taskID}`, {
                method: 'PATCH',
                body: JSON.stringify({text}),
                headers: {
                    'Content-type': 'application/json'
                }
            })

            if (updateTaskResponse .status !== 200) {
                const updateTaskBody = await updateTaskResponse .json()
                return Promise.reject(updateTaskBody)
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Остановка ${text} была успешна изменена`
            }
        } catch(err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            })
        }
    }

    static async updateTasks({reorderedTasks = []} = {reorderedTasks: []}) {
        try {
            const updateTaskResponse = await fetch(`http://localhost:8080/tasks`, {
                method: 'PATCH',
                body: JSON.stringify({ reorderedTasks }),
                headers: {
                    'Content-type': 'application/json'
                }
            })

            if (updateTaskResponse .status !== 200) {
                const updateTaskBody = await updateTaskResponse .json()
                return Promise.reject(updateTaskBody)
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Порядок остановок был успешно изменен`
            }
        } catch(err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            })
        }
    }

    static async deleteTask({taskID})  {
        try {
            const deleteTaskResponse = await fetch(`http://localhost:8080/tasks/${taskID}`, {
                method: 'DELETE',
            })

            if (deleteTaskResponse.status !== 200) {
                const deleteTaskBody = await deleteTaskResponse.json()
                return Promise.reject(deleteTaskBody)
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Остановка ${taskID} была успешна удалена`
            }
        } catch(err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            })
        }
    }

    static async moveTask({taskID, srcCourierID, destCourierID})  {
        try {
            const moveTaskResponse = await fetch(`http://localhost:8080/couriers`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({taskID, srcCourierID, destCourierID})
            })

            if (moveTaskResponse.status !== 200) {
                const moveTaskBody = await moveTaskResponse.json()
                return Promise.reject(moveTaskBody)
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Задание ${taskID} было успешна перемещена`
            }
        } catch(err) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            })
        }
    }
}