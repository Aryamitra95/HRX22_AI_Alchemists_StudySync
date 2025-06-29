import React from 'react'
import { Outlet } from 'react-router';
import { SidebarComponent } from '@syncfusion/ej2-react-navigations';
import { MobileSidebar, NavItems, AuthGuard } from '../../../components';

const AdminLayout = () => {
    return (
        <AuthGuard requireAuth={true} requireAdmin={true}>
            <div className="admin-layout">
                <MobileSidebar />
                <aside className="fixed top-0 left-0 h-screen w-[270px] z-30 hidden lg:block bg-white/95 shadow-lg border-r border-gray-100/50 backdrop-blur-sm">
                    <SidebarComponent width={270} enableGestures={false}>
                        <NavItems />
                    </SidebarComponent>
                </aside>
                <aside className="children ml-0 lg:ml-[270px]">
                    <Outlet />
                </aside>
            </div>
        </AuthGuard>
    );
};

export default AdminLayout;