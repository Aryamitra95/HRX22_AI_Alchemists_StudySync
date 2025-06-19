import {type RouteConfig, index,layout, route} from "@react-router/dev/routes";

export default [
    layout('routes/admin/admin-layout.tsx',[
        route('dashboard','routes/admin/dashboard.tsx'),
        route('mini-games','routes/admin/mini-games.tsx'),
        route('study','routes/admin/study.tsx'),

    ]),

] satisfies RouteConfig;