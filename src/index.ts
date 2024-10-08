export interface PushFunction {
    (href:string):void;
    push:(href:string) => void;
    show:(href:string) => void;
    page:InstanceType<typeof Page>;
}

export interface RouteEventData {
    scrollX:number;
    scrollY:number;
    popstate:boolean;
}

export function singlePage (
    cb:((href:string, data:RouteEventData)=>void),
    opts?:{ pushState:typeof history.pushState }
):PushFunction {
    const page = new Page(cb, opts)
    window.addEventListener('popstate', onpopstate)

    function onpopstate () {
        const href = getPath()
        page.show(href, { popstate: true })
    }
    setTimeout(onpopstate, 0)

    const setRoute:PushFunction = function (href:string) {
        return page.show(href)
    }
    setRoute.push = function (href:string, opts = { popstate: false }) {
        return page.push(href, opts)
    }
    setRoute.show = function (href) { return page.show(href) }
    setRoute.page = page

    return setRoute
}

class Page {
    current:string|null = null;
    hasPushState:boolean|typeof window.history.pushState = false;
    scroll = {};
    cb:((href:string, data:RouteEventData)=>void)|null = null;

    constructor (
        cb:(href:string, data:RouteEventData) => void,
        opts:{
            pushState?: typeof history.pushState
        } = { pushState: undefined }
    ) {
        this.hasPushState = (opts.pushState !== undefined ?
            opts.pushState :
            (window.history && window.history.pushState)
        )

        this.cb = cb
    }

    show (href, opts = { popstate: false }) {
        href = href.replace(/^\/+/, '/')

        this.saveScroll()
        this.current = href

        const scroll = this.scroll[href]
        this.pushHref(href)

        this.cb && this.cb(href, {
            popstate: opts.popstate,
            scrollX: (scroll && scroll[0]) || 0,
            scrollY: (scroll && scroll[1]) || 0
        })
    }

    saveScroll () {
        if (this.scroll && this.current) {
            this.scroll[this.current] = [window.scrollX, window.scrollY]
        }
    };

    pushHref (href:string) {
        this.current = href
        const mismatched = getPath() !== href
        if (mismatched) window.history.pushState(null, '', href)
    }

    push (href:string, opts = { popstate: false }) {
        href = href.replace(/^\/+/, '/')
        this.saveScroll()
        this.pushHref(href)
    }
}

function getPath () {
    return window.location.pathname
        + (window.location.search || '')
        + (window.location.hash || '')
}

export default singlePage
