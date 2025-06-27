import React from 'react'
import {Header, Lifetime, Month} from "../../../components";
import {getUser} from "~/appwrite/auth";
import type {Route} from './+types/dashboard';

interface User {
    name: string;
    // other user properties
}

export const clientLoader = async ()=> await getUser();

const Dashboard = ({loaderData}:Route.ComponentProps) => {
    const user = (loaderData ?? null) as User | null;
    return (
        <main className="dashboard wrapper">
            <Header
            title ={`Welcome ${user?.name ?? 'Guest'}👋`}
            description = "Track concentration level."
            />
            <div className="charts-container grid grid-cols-2 gap-4">
                <Lifetime/>
                <Month/>
            </div>

        </main>

    )
}
export default Dashboard
