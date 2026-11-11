import {PROJECT, onRequest as relay} from './relay.mjs';
export async function reviewResponse(context, render) {
 const {request,env}=context;
 const path=new URL(request.url).pathname;
 if(path.startsWith('/api/website-review/'))return relay(context);
 const response=await render(context);
 // Never expose an unusable panel before both identity and service access are configured.
 if(!PROJECT||env.WEBSITE_REVIEW_ENABLED!=='true'||!env.STUDIO_REVIEW_SERVICE_TOKEN||request.method!=='GET'||!response.headers.get('content-type')?.includes('text/html'))return response;
 const rewritten=new HTMLRewriter().on('head',{element(e){e.append('<link rel="stylesheet" href="/studio-review.css">',{html:true})}}).on('body',{element(e){e.append('<script src="/website-review-link.js" defer></script>',{html:true})}}).transform(response);
 const headers=new Headers(rewritten.headers);headers.delete('Content-Length');headers.delete('ETag');
 return new Response(rewritten.body,{status:rewritten.status,statusText:rewritten.statusText,headers});
}
