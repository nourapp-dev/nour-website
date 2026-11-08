import RecordFollowups from '../../../src/features/admin-workspace/RecordFollowups';
export default async function TasksPage({searchParams}:{searchParams:Promise<{scope?:string;page?:string}>}){const{scope,page}=await searchParams;return <RecordFollowups mine scope={scope} page={Math.max(1,Math.min(100000,Number(page)||1))}/>;}
