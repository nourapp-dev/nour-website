import IntakeDetail from '../../../../src/features/admin-workspace/IntakeDetail';
export default async function ApplicationPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{returnTo?:string}>}){const {id}=await params;const {returnTo}=await searchParams;return <IntakeDetail module="applications" id={id} returnTo={returnTo}/>;}
