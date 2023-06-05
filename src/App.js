import { useState } from 'react'
import { Configuration, OpenAIApi } from 'openai'
import { createClient } from 'backendless-console-sdk'

const mystyle = {
  color: 'white',
  backgroundColor: 'DodgerBlue',
  padding: '10px',
  fontFamily: 'Arial',
}

function createMessages(prompt, tablesSchemas) {
  return [
    {
      role: 'user',
      content: `### Backendless tables, with their properties: 
        #Orders(orderItems, updated, price, objectId, created, )
        #OrderItems(item, updated, quantity, created, objectId, )
        #Items(images, name, price, created, objectId, updated, )
        #Customers(address, orders, created, objectId, updated, name, )
        #Address(geo, street, updated, city, objectId, created, )
        ### Try to create where clause to retrieve all Items related to OrderItems related to Orders related to Customers related to Address with objectId = \"58C9453B-9442-4857-ABD4-3C034E0E6C2C\".
        # Please, respond with where clause only.
        # Please use syntax like in this example: "OrderItems[objectId in (Orders[objectId in (Customers[objectId = 'B36E2D4C-89F4-4195-BDBE-12E03A7FACEC'].orders.objectId)].orderItems.objectId)".
        # Backendless can't use SELECT in subqueries.
        # Please don't use JOIN.
        # objectId column is primary key.
        # Table names in query should start from uppercase letter.
        # Please, respond with template "Where: <where clause> \nSort by: <sort by> \nGroup by <group by>".`,
    },
    {
      role: 'assistant',
      content: `Where: Items[objectId in (OrderItems[objectId in (Orders[objectId in (Customers[objectId='58C9453B-9442-4857-ABD4-3C034E0E6C2C'].orders.objectId)].orderItems.objectId)].item.objectId)]\nSort by: <sort by> \nGroup by <group by>`,
    },
    {
      role: 'user',
      content: `Not Customers with objectId = '58C9453B-9442-4857-ABD4-3C034E0E6C2C', but Customers.address.objectId = '58C9453B-9442-4857-ABD4-3C034E0E6C2C'`,
    },
    {
      role: 'assistant',
      content: `Where: Items[objectId in (OrderItems[objectId in (Orders[objectId in (Customers[address.objectId='58C9453B-9442-4857-ABD4-3C034E0E6C2C'].orders.objectId)].orderItems.objectId)].item.objectId)]\nSort by: <sort by> \nGroup by <group by>`,
    },
    {
      role: 'user',
      content: `Thank you, this one was correct.`,
    },
    {
      role: 'assistant',
      content: `You're welcome! Let me know if you have any more questions.`,
    },
    {
      role: 'user',
      content:
        `### Backendless tables, with their properties: ${tablesSchemas}` +
        `### Try to create where clause to retrieve ${prompt}` +
        '# Please, respond with where clause only.' +
        '# Please use syntax like in this example: "OrderItems[objectId in (Orders[objectId in (Customers[objectId = \'B36E2D4C-89F4-4195-BDBE-12E03A7FACEC\'].orders.objectId)].orderItems.objectId)".' +
        "# Backendless can't use SELECT in subqueries." +
        "# Please don't use JOIN." +
        '# objectId column is primary key.' +
        '# Table names in query should start from uppercase letter.' +
        '# Please, respond with template "Where: <where clause> \nSort by: <sort by> \nGroup by <group by>".`',
    },
  ]
}

function createTableSchemas(tables) {
  let res = '\n'

  for (const table of tables) {
    if (table.system) continue

    res += `#${table.name}(`

    for (const column of table.columns) {
      if (column.name === 'ownerId') continue

      res += `${column.name}, `
    }

    res += `)\n`
  }

  return res
}

function App() {
  const [inputValue, setInputValue] = useState('')
  const [response, setResponse] = useState('')

  const handleChange = (event) => {
    setInputValue(event.target.value)
  }

  const handleReset = () => {
    setInputValue("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const apiClient = createClient(
      'https://develop.backendless.com',
      'jxyvhkkihvkadfndyfkbjbsgbgruqpgnaavp'
    )

    // const res = await apiClient.user.login('alex.sosnovsky@backendlessmail.com', 'wzbox0ho1i79()')

    // console.log(res)

    const tablesData = await apiClient.tables.get(
      '24791ABF-AE63-D664-FF20-E4CDD97BD400'
    )

    console.log(tablesData)

    const tablesSchemas = createTableSchemas(tablesData.tables)

    const messages = createMessages(inputValue, tablesSchemas)

    console.log(messages)

    const configuration = new Configuration({
      apiKey: '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',
    })

    const openai = new OpenAIApi(configuration)

    console.log(inputValue)

    const serverResponse = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages,
    })

    setResponse(serverResponse.data.choices[0].message.content)
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
            <button type="reset" onClick={handleReset}>Reset</button>
          </div>
        </form>
        <p>Response: {response}</p>
      </div>
  )
}

export default App
