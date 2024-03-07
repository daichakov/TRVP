import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import {fileURLToPath} from 'url'
import DB from './db/client.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
    path: './backend/.env'
})

const appHost = process.env.APP_HOST;
const appPort = process.env.APP_PORT;

const app = express()
const db = new DB()

//logging middleware
app.use('*', (req, res, next) => {
    console.log(req.method, req.baseUrl || req.url, new Date().toISOString())
    next()
})

//midleware for static app files
app.use('/', express.static(path.resolve(__dirname, '../dist')))

// get couriers and tasks
app.get('/couriers', async (req, res) => {
    try {
        const [dbCouriers, dbTasks]= await Promise.all([db.getCouriers(), db.getTasks()])
        const tasks = dbTasks.map(({id, text, position, ind }) => ({taskID: id, text, position, ind}))
        const couriers = dbCouriers.map(courier => ({ courierID: courier.id, name: courier.name, tasks: tasks.filter(task => courier.stops.indexOf(task.taskID) !== -1)}))
        res.statusCode = 200
        res.statusMessage = 'OK'
        res.json({ couriers })
    
    } catch(error) {
        res.statusCode = 500
        res.statusMessage = 'Internal server error'
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: 500,
            message: `Getting couriers and tasks error`
        })
    }
})

// body parsing middleware
app.use('/couriers', express.json())
// add courier
app.post('/couriers', async (req, res) => {
    try {
        const {courierID, name} = req.body
        await db.addCourier({courierID, name})
        res.statusCode = 200
        res.statusMessage = 'OK'
        res.send()
    } catch(err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400
                res.statusMessage = 'Bad request'
                break
            default:
                res.statusCode = 500
                res.statusMessage = 'Internal server error'
        }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Add courier error: ${err.error.message || err.error}`
        })
    }
})

// body parsing middleware
app.use('/tasks', express.json())
// add task
app.post('/tasks', async (req, res) => {
    try {
        const {taskID, text, position, index, courierID} = req.body
        await db.addTask({taskID, text, position, index, courierID})
        res.statusCode = 200
        res.statusMessage = 'OK'
        res.send()
    } catch(err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400
                res.statusMessage = 'Bad request'
                break
            default:
                res.statusCode = 500
                res.statusMessage = 'Internal server error'
        }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Add task error: ${err.error.message || err.error}`
        })
    }
})

// body parsing middleware
app.use('/couriers/:courierID', express.json())
//edit courier
app.patch('/couriers/:courierID', async (req, res) => {
    try {
        const {courierID} = req.params
        const {name} = req.body
        await db.updateCourier({courierID, name})
        res.statusCode = 200
        res.statusMessage = 'OK'
        res.send()
    } catch(err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400
                res.statusMessage = 'Bad request'
                break
            default:
                res.statusCode = 500
                res.statusMessage = 'Internal server error'
        }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update courier error`
        })
    }
})

// body parsing middleware
app.use('/tasks/:taskID', express.json())
// edit task 
app.patch('/tasks/:taskID', async (req, res) => {
    try {
        const {taskID} = req.params
        const {text, position} = req.body
        await db.updateTask({taskID, text, position})
        res.statusCode = 200
        res.statusMessage = 'OK'
        res.send()
    } catch(err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400
                res.statusMessage = 'Bad request'
                break
            default:
                res.statusCode = 500
                res.statusMessage = 'Internal server error'
        }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update task error: ${err.error.message || err.error}`
        })
    }
})


app.patch('/tasks', async (req, res) => {
    try {
        const { reorderedTasks } = req.body

        await Promise.all(
            reorderedTasks.map(({ taskID, position }) => db.updateTask({ taskID, position }))
        )
        
        res.statusCode = 200
        res.statusMessage = 'OK'
        res.send()
    } catch(err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400
                res.statusMessage = 'Bad request'
                break
            default:
                res.statusCode = 500
                res.statusMessage = 'Internal server error'
        }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update tasks error: ${err.error.message || err.error}`
        })
    }
})


//delete courier
app.delete('/tasks/:taskID', async (req, res) => {
    try {
        const {taskID} = req.params
        await db.deleteTask({taskID})
        res.statusCode = 200
        res.statusMessage = 'OK'
        res.send()
    } catch(err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400
                res.statusMessage = 'Bad request'
                break
            default:
                res.statusCode = 500
                res.statusMessage = 'Internal server error'
        }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Delete task error: ${err.error.message || err.error}`
        })
    }
})

// move task between cvouriers
app.patch('/couriers', async (req, res) => {
    try {
        const {taskID, srcCourierID, destCourierID} = req.body
        await db.moveTask({taskID, srcCourierID, destCourierID})
        res.statusCode = 200
        res.statusMessage = 'OK'
        res.send()
    } catch(err) {
        switch (err.type) {
            case 'client':
                res.statusCode = 400
                res.statusMessage = 'Bad request'
                break
            default:
                res.statusCode = 500
                res.statusMessage = 'Internal server error'
        }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Move task error: ${err.error.message || err.error}`
        })
    }
})


const server = app.listen(Number(appPort), appHost, async () => {
    try {
        await db.connect();
    } catch (error) {
        console.log('app shut down')
        process.exit(100)
    }

    console.log(`app started at host http://${appHost}:${appPort}`)
})

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing server')
    server.close(async () => {
        await db.disconnect()
        console.log('HTTP server closed')
    })
})