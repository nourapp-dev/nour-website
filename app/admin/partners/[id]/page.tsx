import IntakeDetail from '../../../../src/features/admin-workspace/IntakeDetail';
export default async function PartnerPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{returnTo?:string}>}){const {id}=await params;const {returnTo}=await searchParams;return <IntakeDetail module="partners" id={id} returnTo={returnTo}/>;}
