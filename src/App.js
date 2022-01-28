import './index.css';
import {populateDatabase} from "./databaseFTS";

import {useEffect, useState} from "react";
import {Link, Route, Routes} from "react-router-dom";
import FTSTestView from "./Views/FTSTestView";
import LiveQueryView from "./Views/LiveQueryView";

const sources = [
    {
        title: 'Alice in Wonderland',
        size: 'Medium',
        url: 'https://gist.githubusercontent.com/phillipj/4944029/raw/75ba2243dd5ec2875f629bf5d79f6c1e4b5a8b46/alice_in_wonderland.txt'
    },
    {
        title: 'War and Peace',
        size: 'Large',
        url: 'https://raw.githubusercontent.com/mmcky/nyu-econ-370/master/notebooks/data/book-war-and-peace.txt'
    }
]


const SelectCurrentSource = ({disabled, currentSource, setCurrentSource}) => {

    const handleUpdateCurrentSource = (e) => {
        const selectedSourceTitle = e.target.value
        const newSource = sources.find((source) => source.title === selectedSourceTitle)
        setCurrentSource(newSource)
    }

    return <select disabled={disabled} value={currentSource.title} onChange={handleUpdateCurrentSource} name="" id="">
        {sources.map(source => <option key={source.title} value={source.title}>{source.title}</option>)}
    </select>
}

function App() {

    const [sourceLoaded, setSourceLoaded] = useState(false)
    const [loadingProgress, setLoadingProgress] = useState('')
    const [currentSource, setCurrentSource] = useState(sources[0])
    const [selectedSource, setSelectedSource] = useState(sources[0])
    const [currentSourceStats, setCurrentSourceStats] = useState({})

    useEffect(() => {
        loadSource()

    }, [])

    const loadSource = async () => {
        setSourceLoaded(false)
        const loadedSourceStats = await populateDatabase(selectedSource.url, setLoadingProgress)
        setCurrentSourceStats(loadedSourceStats)
        setCurrentSource(selectedSource)
        setSourceLoaded(true)
    }

    const generateStats = () => {
        if(!sourceLoaded || !currentSourceStats) {
            return null
        } else {
            return <table>
                <tbody>
                    <tr><th className='align-left'>Word Count</th><td className='align-left'>{currentSourceStats.wordCount}</td></tr>
                    <tr><th className='align-left'>Paragraph Count</th><td className='align-left'>{currentSourceStats.paragraphCount}</td></tr>
                </tbody>
            </table>
        }
    }
    const generateMain = () => {
        if (!sourceLoaded) {
            return <>
                <div>Loading <em>{selectedSource.title}</em>:</div>
                <div>{loadingProgress}</div>
            </>
        } else {
            return <>
                <header>
                    {generateStats()}
                    <fieldset className='select-current-source'>
                        <legend>Select new source</legend>
                        <SelectCurrentSource disabled={!sourceLoaded} currentSource={selectedSource}
                                             setCurrentSource={setSelectedSource}/>
                        <button disabled={!sourceLoaded} onClick={loadSource}>Load New Source</button>
                    </fieldset>
                    <div>
                        <hr/>
                    </div>
                    <nav className='app-nav'>
                        <Link to='FTSTest'>Search Test</Link>
                        <Link to='liveQuery'>Live Searching</Link>
                    </nav>

                </header>
                <div>
                    <hr/>

                </div>

                <Routes>
                    <Route path='/FTSTest' element={<FTSTestView/>}/>
                    <Route path='/liveQuery' element={<LiveQueryView/>}/>
                </Routes>
            </>
        }
    }


    return (
        <div id='APP'>
            <header>
                <h1>IndexedDB (Dexie) Full-Text-Search Testing</h1>
                <div> Current Source: <br/> <h2>{currentSource.title} </h2></div>
            </header>
            <main>
                {generateMain()}
            </main>
        </div>
    );
}

export default App;
