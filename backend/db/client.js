import pg from 'pg'

export default class DB {
    #dbClient = null
    #dbHost = ''
    #dbPort = ''
    #dbName = ''
    #dbLogin = ''
    #dbPassword = ''

    constructor() {
        this.#dbHost = process.env.DB_HOST
        this.#dbPort = process.env.DB_PORT
        this.#dbName = process.env.DB_NAME
        this.#dbLogin = process.env.DB_LOGIN
        this.#dbPassword = process.env.DB_PASSWORD

        this.#dbClient = new pg.Client({
            user: this.#dbLogin,
            password: this.#dbPassword,
            host: this.#dbHost,
            port: this.#dbPort,
            database: this.#dbName
        })
    }

    async connect() {
        try {
            await this.#dbClient.connect()
            console.log('DB connection established')
        } catch(error) {
            console.error('Unable to connect to DB: ', error)
            return Promise.reject(error)
        }
    }

    async disconnect() {
        await this.#dbClient.end()
        console.log('DB disconected')
    }

    async getCouriers () {
        try {
            const couriers = await this.#dbClient.query(
                'SELECT * FROM routes ORDER BY id;'
                )
                return couriers.rows
        } catch(error) {
            console.error('Unable to get routes: ', error);
            return Promise.reject({
                type: 'internal',
                error
            })
        }
    }

    async getTasks () {
        try {
            const tasks = await this.#dbClient.query(
                'SELECT * FROM stops ORDER BY route_id, position;'
                )
                return tasks.rows
        } catch(error) {
            console.error('Unable to get ыещзыs: ', error);
            return Promise.reject({
                type: 'internal',
                error
            })
        }
    }

    async addCourier({ courierID, name} = {courierID: null, name: ''}) {
        if (!courierID || !name) {
            const errMsg = 'Add route error: wrong params'
            console.error(errMsg)
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            })
        }
        try {
            await this.#dbClient.query(
                'INSERT INTO routes (id, name) VALUES ($1, $2);',
                [courierID, name]
                )
        } catch(error) {
            console.error('Unable to add route: ', error);
            return Promise.reject({
                type: 'internal',
                error
            })
        }
    }

    async addTask({ 
        taskID, 
        text,
        position = -1,
        index = -1,
        courierID
    } = {
        taskID: null, 
        text: '',
        position: -1, 
        index: -1,
        courierID: null
    }) {
        if (!taskID || !text || position <= 0 || !courierID) {
            const errMsg = `Add task error: wrong params ${taskID}, ${text}, ${position}, ${index}, ${courierID}`
            console.error(errMsg)
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            })
        }
        try {
            await this.#dbClient.query(
                'INSERT INTO stops (id, text, position, ind, route_id) VALUES ($1, $2, $3, $4, $5);',
                [taskID, text, position, index, courierID]
                )
            await this.#dbClient.query(
                'UPDATE routes SET stops = array_append(stops, $1) WHERE id = $2;',
                [taskID, courierID]
                )
        } catch(error) {
            console.error('Unable to add task: ', error);
            return Promise.reject({
                type: 'internal',
                error
            })
        }
    }

    async updateCourier({courierID, name} = {courierID: null, name: ''}) {
        if (!courierID || !name)  {
            const errMsg = 'Update courier error: wrong params'
            console.error(errMsg)
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            })
        }
        let query = null
        const queryParams = []
        if (name) {
            query = 'UPDATE routes SET name = $1 WHERE id = $2;'
            queryParams.push(name, courierID)
        }

        try {
            await this.#dbClient.query(query, queryParams)
        } catch(error) {
            console.error('Unable to update courier: ', error);
            return Promise.reject({
                type: 'internal',
                error
            })
        }
    }

    async updateTask({taskID, text, position = -1} = {taskID: null, text: '', position: -1}) {
        if (!taskID || (!text && position < 0))  {
            const errMsg = `Update task error: wrong params ${taskID} ${text} ${position}`
            console.error(errMsg)
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            })
        }
        let query = null
        const queryParams = []
        if (text && position) {
            query = 'UPDATE stops SET text = $1, position = $2 WHERE id = $3;'
            queryParams.push(text, position, taskID)
        } else if(text) {
            query = 'UPDATE stops SET text = $1, WHERE id = $2;'
            queryParams.push(text, taskID)
        } else {
            query = 'UPDATE stops SET position = $1 WHERE id = $2;'
            queryParams.push(position, taskID)
        }
        console.log('here')
        try {
            await this.#dbClient.query(query, queryParams)
        } catch(error) {
            console.error('Unable to update stops: ', error);
            return Promise.reject({
                type: 'internal',
                error
            })
        }
    }

    async deleteTask({taskID} = {taskID: null}) {
        if (!taskID) {
            const errMsg = 'Delete task error: wrong params'
            console.error(errMsg)
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            })
        }
        try {
            const queryResult = await this.#dbClient.query(
                'SELECT route_id FROM stops WHERE id = $1;',
                [taskID]
            )
            const {route_id: courierID} = queryResult.rows[0]

            await this.#dbClient.query(
                'DELETE FROM stops WHERE id = $1;',
                [taskID]
                )
            await this.#dbClient.query(
                'UPDATE routes SET stops = array_remove(stops, $1) WHERE id = $2;',
                [taskID, courierID]
                )
        } catch(error) {
            console.error('Unable to delete task: ', error);
            return Promise.reject({
                type: 'internal',
                error
            })
        }
    }

    async moveTask({taskID, srcCourierID, destCourierID} = {taskID: null, srcCourierID: null, destCourierID: null}) {
        if (!taskID || !srcCourierID || !destCourierID) {
            const errMsg = 'Move task error: wrong params'
            console.error(errMsg)
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            })
        }
        try {
            await this.#dbClient.query(
                'UPDATE stops SET route_id = $1 WHERE id = $2;',
                [destCourierID, taskID]
            )
            await this.#dbClient.query(
                'UPDATE routes SET stops = array_append(stops, $1) WHERE id = $2;',
                [taskID, destCourierID]
                )
            await this.#dbClient.query(
                'UPDATE routes SET stops = array_remove(stops, $1) WHERE id = $2;',
                [taskID, srcCourierID]
                )
        } catch(error) {
            console.error('Unable to move task: ', error);
            return Promise.reject({
                type: 'internal',
                error
            })
        }
    }
}