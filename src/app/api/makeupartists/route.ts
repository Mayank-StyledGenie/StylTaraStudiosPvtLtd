import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

interface PortfolioFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  data: Buffer;
}

interface MakeupArtistData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  experience?: string;
  agreeToTerms?: boolean;
  createdAt: Date;
  portfolioFile?: PortfolioFile;
  [key: string]: unknown; 
}

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB_FREELANCER as string;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const photographerData: MakeupArtistData = {
      createdAt: new Date()
    };
    
    for (const [key, value] of formData.entries()) {
      if (key !== 'certificationsFile') {
        if (key === 'agreeToTerms') {
          photographerData[key] = value === 'true';
        } else {
          photographerData[key] = value as string;
        }
      }
    }
    
    const file = formData.get('certificationsFile') as File | null;
    if (file) {
      const fileBuffer = await file.arrayBuffer();
      
      photographerData.portfolioFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        data: Buffer.from(fileBuffer)
      };
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const collection = db.collection('freelancer_makeupartists');
    
    const result = await collection.insertOne(photographerData);
    
    await client.close();
    
    await sendConfirmationEmails(photographerData);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Makeup Artist registered successfully',
      id: result.insertedId 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in Makeup Artist registration:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to register Makeup Artist', 
    }, { status: 500 });
  }
}

async function sendConfirmationEmails(artistData: MakeupArtistData) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  const artistMailOptions: MailOptions = {
    from: process.env.MAIL_USER as string,
    to: artistData.email as string,
    subject: 'StylTara Studios: Makeup Artist Registration Confirmation',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>StylTara Studios Registration Confirmation</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          
          body {
            font-family: 'Poppins', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }
          
          .email-header {
            background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
            padding: 30px 0;
            text-align: center;
            color: white;
          }
          
          .email-body {
            padding: 40px 30px;
            color: #4a5568;
          }
          
          .welcome-title {
            color: #2d3748;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
            text-align: center;
          }
          
          .message {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 25px;
          }
          
          .highlight-box {
            background-color: #f7fafc;
            border-left: 4px solid ##401735;
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 5px 5px 0;
          }
          
          .highlight-text {
            font-weight: 500;
            font-size: 16px;
            color: #2d3748;
            margin: 0;
          }
          
          .cta-container {
            text-align: center;
            margin: 35px 0;
          }
          
          .cta-button {
            display: inline-block;
            background-color:#401735;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 30px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.3s;
          }
          
          .divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 30px 0;
          }
          
          .email-footer {
            background-color: #1a202c;
            color: #e2e8f0;
            padding: 30px;
            text-align: center;
            font-size: 14px;
          }
          
          .footer-links {
            margin-bottom: 15px;
          }
          
          .footer-link {
            color: #e2e8f0;
            text-decoration: none;
            margin: 0 10px;
          }
          
          .address {
            font-size: 12px;
            color: #a0aec0;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>StylTara Studios</h1>
          </div>
          
          <div class="email-body">
            <h1 class="welcome-title">Application Received!</h1>
            
            <p class="message">We’ve received your application for the Makeup Artist position and would like to thank you for your interest in career opportunities with StylTara Studios Pvt Ltd.</p>
            
            <p class="message">Our Talent Acquisition team will carefully assess your qualifications for the role you selected. If you are selected for further consideration, we will get in touch with you.
            </p>
            
            <p class="message">If you have any questions, please don't hesitate to contact us at <a href="mailto:support@styltarastudios.com">info@styltarastudios.com</a></p>
            <iv class = 'message'>
            <p class="message">Sincerely, </p>
            <p class="message">Team StylTara Studios </p>

             <div class="divider"></div>
             <div class = 'message'>
              <p> This is an automated message. Please do not reply.</p>
            </div>
        </div>
      </body>
      </html>
    `
  };

  const adminMailOptions: MailOptions = {
    from: process.env.MAIL_USER as string,
    to: process.env.MAIL_USER as string, 
    subject: 'New Makeup Artist Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h2 style="color: #401735; border-bottom: 2px solid #401735; padding-bottom: 10px;">New Makeup Artist Registration</h2>
        <p>A new makeup artist has registered on your platform.</p>
        
        <h3 style="color: #4a5568;">Artist Details:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Name:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${artistData.fullName ?? artistData.firstName ?? ''} ${artistData.lastName ?? ''}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${artistData.email ?? 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${artistData.phone ?? 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Experience:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${artistData.experience ?? 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Registration Date:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${artistData.createdAt.toLocaleString()}</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f7fafc; border-radius: 5px;">
          <h4 style="margin-top: 0; color: #4a5568;">Portfolio File:</h4>
          ${artistData.portfolioFile 
            ? `<p>The portfolio file has been attached to this email.</p>` 
            : `<p>No portfolio file was uploaded.</p>`}
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #718096;">This is an automated message from your StylTara Studios website.</p>
      </div>
    `,
    attachments: []
  };

  if (artistData.portfolioFile?.data) {
    const fileData = artistData.portfolioFile.data;
    
    adminMailOptions.attachments = [{
      filename: artistData.portfolioFile.name,
      content: fileData,
      contentType: artistData.portfolioFile.type
    }];
  }
  try {
    await transporter.sendMail(artistMailOptions);
    await transporter.sendMail(adminMailOptions);
  } catch (error) {
    console.error('Error sending confirmation emails:', error);
   
  }
}