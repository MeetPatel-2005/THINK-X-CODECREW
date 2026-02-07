import React from 'react'

const BotMsg = ({msg}: {msg? : string}) => {
  return (
    <div className='w-full flex flex-col items-start justify-end mb-2 relative z-10'>
            <h1 className='bg-zinc-100 text-black px-4 py-2 rounded-x-2xl rounded-t-2xl rounded-br-2xl rounded-bl-sm max-w-[75%]'>{msg}</h1>
    </div>
  )
}

export default BotMsg