import React, {useState, useReducer, useEffect, Suspense} from "react";
import  ReactDOM  from "react-dom/client";
import { useImmerReducer } from "use-immer";
import {BrowserRouter, Routes, Route} from "react-router-dom"
import Axios from "axios";
import {CSSTransition} from "react-transition-group"


Axios.defaults.baseURL = process.env.BACKENDURL || "https://reactbackendapp.onrender.com"

//Contexts
import StateContext from "./StateContext";
import DispatchContext from "./DispatchContext";

//Components
import Header from "./Components/Header";
import HomeGuest from "./Components/HomeGuest";
import Footer from "./Components/Footer";
import About from "./Components/About";
import Terms from "./Components/Terms";
import Home from "./Components/Home";
const CreatePost = React.lazy(() => import("./Components/CreatePost"))
const ViewSinglePost = React.lazy(() => import("./Components/ViewSinglePost"))
import FlashMessages from "./Components/FlashMessages";
import Profile from "./Components/Profile";
import EditPost from "./Components/EditPost"
import NotFound from "./Components/NotFound"
const Search = React.lazy(() => import("./Components/Search"))
const Chat = React.lazy(() => import("./Components/Chat"))
import LoadingDotsIcon from "./Components/LoadingDotsIcon";

function Main() {
    const initialState = {
        loggedIn: Boolean(localStorage.getItem("complexappToken")),
        flashMessages: [],
        user: {
            token: localStorage.getItem("complexappToken"),
            username: localStorage.getItem("complexappUsername"),
            avatar: localStorage.getItem("complexappAvatar")
        },
        isSearchOpen: false,
        isChatOpen: false,
        unreadChatCount: 0
    }

    function ourReducer(draft, action){
        switch (action.type){
            
            case "login":
                draft.loggedIn = true
                draft.user = action.data
                return

            case "logout":
                draft.loggedIn = false
                return

            case "flashMessage":
                draft.flashMessages.push(action.value)
                return

            case "openSearch":
                draft.isSearchOpen = true
                return

            case "closeSearch":
                draft.isSearchOpen = false
                return
            
            case "toggleChat":
                draft.isChatOpen = !draft.isChatOpen
                return
            
            case "closeChat": 
                draft.isChatOpen = false
                return

            case "incrementUnreadChatCount":
                draft.unreadChatCount++
                return
            
            case "clearUnreadChatCount":
                draft.unreadChatCount = 0;
                return
        }
    }

    const [state, dispatch] = useImmerReducer(ourReducer, initialState)

    useEffect(()=>{
        if(state.loggedIn){
            localStorage.setItem("complexappToken", state.user.token)
            localStorage.setItem("complexappUsername", state.user.username)
            localStorage.setItem("complexappAvatar", state.user.avatar)
        }else{
            localStorage.removeItem("complexappToken")
            localStorage.removeItem("complexappUsername")
            localStorage.removeItem("complexappAvatar")
        }
    }, [state.loggedIn])


    //Check if token has expired or not

    useEffect(() =>{
        if(state.loggedIn){
          const ourRequest = Axios.CancelToken.source()
          async function fetchResults(){
            try {
              const response = await Axios.post('/checkToken', {token: state.user.token}, {cancelToken: ourRequest.token})
              if (!response.data) {
                dispatch({type: "logout"})
                dispatch({type: "flashMessage", value: "Your session has Expired."})
              }
            } catch (e) {
              console.log("The request was cancelled")
            }
          }
    
          fetchResults()
          return () => ourRequest.cancel()
        }
      }, [])


    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>
                <BrowserRouter>
                    <FlashMessages messages={state.flashMessages}/>
                    <Header  />
                    <Suspense fallback={<LoadingDotsIcon />}>
                        <Routes>
                            <Route path="profile/:username/*" element={<Profile />}/>
                            <Route path="/" element={state.loggedIn ? <Home /> : <HomeGuest />} />
                            <Route path="/post/:id" element={<ViewSinglePost />} />
                            <Route path="/post/:id/edit" element={<EditPost />} />
                            <Route path="/create-post" element={<CreatePost />}/>
                            <Route path="/about-us" element={<About />}/>
                            <Route path="/terms" element={<Terms />}/>
                            <Route path="*" element={<NotFound />}/>
                        </Routes>
                    </Suspense>
                    <CSSTransition timeout={330} in={state.isSearchOpen} classNames="search-overlay" unmountOnExit>
                        <div className="search-overlay">
                            <Suspense fallback="">
                                <Search />
                            </Suspense>
                        </div>
                    </CSSTransition>
                    
                    <Suspense fallback="">
                        {state.loggedIn && <Chat />}
                    </Suspense>
                    <Footer />
                </BrowserRouter>
            </DispatchContext.Provider>
        </StateContext.Provider>
        
    )
}

const root = ReactDOM.createRoot(document.querySelector("#app"))
root.render(<Main />)


if (module.hot){
    module.hot.accept()
}