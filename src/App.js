import { useState } from 'react'
import axios from 'axios'

function createMessages(prompt) {
  return [
    {
      role: 'user',
      content: prompt,
    },
  ]
}

function createAIFunctions() {
  return [
    {
      name: 'getCurrentWeather',
      description: 'Get the current temperature, "feels like" temperature, weather condition and wind speed in kph in a given city',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'The city, e.g. Kyiv',
          },
        },
        required: ['city'],
      },
    },
  ]
}

async function getCurrentWeather(city) {
  const { weatherKey } = await getKeys()
  let weatherInfo = await axios.get(
    `http://api.weatherapi.com/v1/current.json?key=${weatherKey}&q=${city}`
  )

  return {
    condition: weatherInfo.data.current.condition.text,
    temperature_celsius: weatherInfo.data.current.temp_c,
    feels_like_celsius: weatherInfo.data.current.feelslike_c,
    wind_kph: weatherInfo.data.current.wind_kph
  }
}

async function getKeys() {
  const response = await fetch(
    'https://steamyjail.backendless.app/api/services/Test/chatgptKey'
  )
  return response.json()
}

function App() {
  const [inputValue, setInputValue] = useState('')
  const [response, setResponse] = useState('')

  const handleChange = (event) => {
    setInputValue(event.target.value)
  }

  const handleReset = () => {
    setInputValue('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const messages = createMessages(inputValue)
    const functions = createAIFunctions()

    const { aiKey } = await getKeys()

    const ai_response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo-0613',
        messages,
        functions,
        function_call: 'auto',
      },
      {
        headers: {
          Authorization: `Bearer ${aiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const responseMessage = ai_response.data.choices[0].message

    if (responseMessage.function_call) {
      const availableFunctions = {
        getCurrentWeather,
      };
      const functionName = responseMessage.function_call.name;
      const functionToCall = availableFunctions[functionName];
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);
      const functionResponse = await functionToCall(
        functionArgs.city
      );
  
      messages.push(responseMessage);
      messages.push({
        role: 'function',
        name: functionName,
        content: JSON.stringify(functionResponse),
      });
  
      const second_response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo-0613',
        messages,
      }, {
        headers: {
          'Authorization': `Bearer ${aiKey}`,
          'Content-Type': 'application/json',
        },
      });
  
      setResponse(second_response.data.choices[0].message.content)
    }
  }

  return (
    <div className="card">
      <h2>ChatGPT query help</h2>
      <form onSubmit={handleSubmit}>
        <label className="input">
          <input
            className="input__field"
            type="text"
            placeholder=" "
            value={inputValue}
            onChange={handleChange}
          />
        </label>
        <div className="button-group">
          <button>Submit</button>
          <button type="reset" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>
      <p>Response: {response}</p>
    </div>
  )
}

export default App
