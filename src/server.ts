import express, { Request, Response } from 'express';

import { Client } from '@notionhq/client';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

const whitelist = ['http://localhost:3000', process.env.PRODUCTION_REACT_APP_URL];

// CORS options
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Apply CORS middleware
app.use(cors(corsOptions));

app.use(express.json());

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

interface TradeRecord {
  name: string;
  author: string;
  datetime: string;
  pnl: number;
  currencyPair: string;
}

app.post('/trades', async (req: Request<{}, {}, TradeRecord>, res: Response) => {
  const { name, author, datetime, pnl, currencyPair } = req.body;

  try {
    if (!databaseId) {
      throw new Error('Database ID is not defined');
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [{ text: { content: name } }],
        },
        Datetime: {
          date: { start: datetime },
        },
        'Profit / Loss': {
          number: pnl,
        },
        Symbol: {
          select: { name: currencyPair },
        },
      },
    });

    res.status(201).json({ message: 'Trade record created successfully', id: response.id });
  } catch (error) {
    console.error('Error creating trade record:', error);
    res.status(500).json({ message: 'Error creating trade record' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));