import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {createBrowserRouter, RouterProvider} from "react-router";
import Admin from "./components/admin/Admin.jsx";

let routes = [
    {
        path: "/",
        index: true,
        element: <App/>,
    },
    {
        path: "/admin",
        Component: Admin,
        children: [
            {
                index: true,
                path: ":adminPath",
                Component: Admin,
            }
        ]

    }
]


const baseUrl = `${import.meta.env.BASE_URL}`
if (baseUrl  && baseUrl !== '' && baseUrl !== '/') {
    routes = routes.map(o => {
        if (!o.path) {
            return {...o, path: baseUrl}
        } else {
            return {...o, path: baseUrl + o.path}
        }
    })
}


ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <RouterProvider router={createBrowserRouter(routes)} />
  // </React.StrictMode>,
)
