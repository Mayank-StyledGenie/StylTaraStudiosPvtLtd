import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface BaseFormData {
  contactPersonName?: string;
  contactInfo?: string;
  email?: string;
  fullName?: string;
  companyName?: string;
}

interface CorporateStyleData extends BaseFormData {
  designation: string;
  numberOfParticipants: string;
  exactNumberOfParticipants?: string;
  serviceType: string;
  industryType: string;
  otherIndustryType?: string;
  companyLocation: string;
  preferredDates: string | Date;
  serviceMode: string;
  dressCodeGuidelines?: string;
  sessionObjectives: string;
  additionalNotes?: string;
  status: string;
  paymentId?: string;
  orderId?: string;
  paymentVerified?: boolean;
  paymentDate?: Date;
}

interface PersonalizedConsultationData extends BaseFormData {
  fullName: string;
  email: string;
  phone: string;
  consultationMode: string;
  ageGroup: string;
  gender: string;
  occupation?: string;
  location: string;
  preferredDateTime: string | Date;
  stylingGoals: string[];
  bodyConcerns?: string;
  additionalNotes?: string;
  status: string;
  paymentId?: string;
  orderId?: string;
}

interface PhotoshootStyleData extends BaseFormData {
  fullName: string;
  email: string;
  phone: string;
  photoshootType: string;
  location: string;
  preferredDate: string | Date;
  hasPhotographer: string;
  stylingRequirements: string;
  needsHairMakeup: string;
  theme?: string;
  budgetRange: number;
  additionalNotes?: string;
  references?: Array<{
    name: string;
    type: string;
    size: number;
    lastModified: number;
    data: string | Buffer;
  }>;
  status: string;
  paymentId?: string;
  orderId?: string;
  paymentVerified?: boolean;
  paymentDate?: Date;
}

interface WeddingStylingData extends BaseFormData {
  fullName: string;
  contactEmail: string;
  contactPhone: string;
  weddingLocation: string;
  weddingDate: string | Date;
  package: string;
  events: string[];
  hasVendors: string;
  consultationMode: string;
  budgetRange: string;
  additionalNotes?: string;
  inspirationImages?: Array<{
    name: string;
    type: string;
    size: number;
    lastModified: number;
    data: string | Buffer;
  }>;
  status: string;
  paymentId?: string;
  orderId?: string;
  paymentVerified?: boolean;
  paymentDate?: Date;
}

interface MakeupTrainingData extends BaseFormData {
  fullName: string;
  contactEmail: string;
  contactPhone: string;
  consultationMode: string;
  trainingLocation?: string;
  areaOfInterest: string;
  hasBackground: string;
  backgroundDetails?: string;
  trainingReason?: string;
  preferredLanguage: string;
  preferredDateTime: string | Date;
  additionalQuestions?: string;
  status: string;
  paymentId?: string;
  orderId?: string;
  paymentVerified?: boolean;
  paymentDate?: Date;
}

interface SoftSkillsData extends BaseFormData {
  fullName: string;
  contactEmail: string;
  contactPhone: string;
  occupation: string;
  coachingPurpose: string;
  coachingMode: string;
  preferredDateTime: string | Date;
  hasPreviousCoaching: string;
  preferredLanguage: string;
  additionalExpectations?: string;
  status: string;
  paymentId?: string;
  orderId?: string;
  paymentVerified?: boolean;
  paymentDate?: Date;
}

interface EmailRequest {
  formType: 'corporate_styling' | 'personalized_consultation' | 'photoshoot_styling' | 'wedding_styling' | 'makeup_training' | 'soft_skills';
  purpose: 'submission' | 'payment' | 'other';
  data: Record<string, unknown>;
}

async function handleCorporateStyleRequest(data: Record<string, unknown>, purpose: string): Promise<NextResponse> {
  const validateCorporateData = (data: Record<string, unknown>): data is Record<string, unknown> & CorporateStyleData => {
    return typeof data.contactPersonName === 'string' && 
           typeof data.contactInfo === 'string' && 
           typeof data.companyName === 'string';
  };

  if (!validateCorporateData(data)) {
    return NextResponse.json({
      status: 'failed',
      message: 'Invalid data format for corporate styling'
    }, { status: 400 });
  }

  if (purpose === 'submission') {
    await sendCorporateFormSubmissionEmails(data);
  } else if (purpose === 'payment') {
    await sendCorporatePaymentConfirmationEmails(data);
  } else {
    return NextResponse.json({
      status: 'failed',
      message: `Unknown purpose: ${purpose}`
    }, { status: 400 });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Emails sent successfully'
  });
}

async function handlePersonalizedConsultationRequest(data: Record<string, unknown>, purpose: string): Promise<NextResponse> {
  const validatePersonalizedData = (data: Record<string, unknown>): data is Record<string, unknown> & PersonalizedConsultationData => {
    return typeof data.fullName === 'string' && 
           typeof data.email === 'string';
  };

  if (!validatePersonalizedData(data)) {
    return NextResponse.json({
      status: 'failed',
      message: 'Invalid data format for personalized consultation'
    }, { status: 400 });
  }

  if (purpose === 'submission') {
    await sendPersonalizedConsultationSubmissionEmails(data);
  } else if (purpose === 'payment') {
    await sendPersonalizedConsultationPaymentEmails(data);
  } else {
    return NextResponse.json({
      status: 'failed',
      message: `Unknown purpose: ${purpose}`
    }, { status: 400 });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Emails sent successfully'
  });
}

async function handlePhotoshootStyleRequest(data: Record<string, unknown>, purpose: string): Promise<NextResponse> {
  const validatePhotoshootData = (data: Record<string, unknown>): data is Record<string, unknown> & PhotoshootStyleData => {
    return typeof data.fullName === 'string' && 
           typeof data.email === 'string' && 
           typeof data.phone === 'string';
  };

  if (!validatePhotoshootData(data)) {
    return NextResponse.json({
      status: 'failed',
      message: 'Invalid data format for photoshoot styling'
    }, { status: 400 });
  }

  if (purpose === 'submission') {
    await sendPhotoshootStylingSubmissionEmails(data);
  } else if (purpose === 'payment') {
    await sendPhotoshootStylingPaymentEmails(data);
  } else {
    return NextResponse.json({
      status: 'failed',
      message: `Unknown purpose: ${purpose}`
    }, { status: 400 });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Emails sent successfully'
  });
}

async function handleWeddingStylingRequest(data: Record<string, unknown>, purpose: string): Promise<NextResponse> {
  const validateWeddingData = (data: Record<string, unknown>): data is Record<string, unknown> & WeddingStylingData => {
    return typeof data.fullName === 'string' && 
           typeof data.contactEmail === 'string' && 
           typeof data.contactPhone === 'string';
  };

  if (!validateWeddingData(data)) {
    return NextResponse.json({
      status: 'failed',
      message: 'Invalid data format for wedding styling'
    }, { status: 400 });
  }

  if (purpose === 'submission') {
    await sendWeddingStylingSubmissionEmails(data);
  } else if (purpose === 'payment') {
    await sendWeddingStylingPaymentEmails(data);
  } else {
    return NextResponse.json({
      status: 'failed',
      message: `Unknown purpose: ${purpose}`
    }, { status: 400 });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Emails sent successfully'
  });
}

async function handleMakeupTrainingRequest(data: Record<string, unknown>, purpose: string): Promise<NextResponse> {
  const validateMakeupData = (data: Record<string, unknown>): data is Record<string, unknown> & MakeupTrainingData => {
    return typeof data.fullName === 'string' && 
           typeof data.contactEmail === 'string' && 
           typeof data.contactPhone === 'string' &&
           typeof data.areaOfInterest === 'string';
  };

  if (!validateMakeupData(data)) {
    return NextResponse.json({
      status: 'failed',
      message: 'Invalid data format for makeup training consultation'
    }, { status: 400 });
  }

  if (purpose === 'submission') {
    await sendMakeupTrainingSubmissionEmails(data);
  } else if (purpose === 'payment') {
    await sendMakeupTrainingPaymentEmails(data);
  } else {
    return NextResponse.json({
      status: 'failed',
      message: `Unknown purpose: ${purpose}`
    }, { status: 400 });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Emails sent successfully'
  });
}

async function handleSoftSkillsRequest(data: Record<string, unknown>, purpose: string): Promise<NextResponse> {
  const validateSoftSkillsData = (data: Record<string, unknown>): data is Record<string, unknown> & SoftSkillsData => {
    return typeof data.fullName === 'string' && 
           typeof data.contactEmail === 'string' && 
           typeof data.contactPhone === 'string' &&
           typeof data.occupation === 'string' &&
           typeof data.coachingPurpose === 'string';
  };

  if (!validateSoftSkillsData(data)) {
    return NextResponse.json({
      status: 'failed',
      message: 'Invalid data format for soft skills coaching'
    }, { status: 400 });
  }

  if (purpose === 'submission') {
    await sendSoftSkillsSubmissionEmails(data);
  } else if (purpose === 'payment') {
    await sendSoftSkillsPaymentEmails(data);
  } else {
    return NextResponse.json({
      status: 'failed',
      message: `Unknown purpose: ${purpose}`
    }, { status: 400 });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Emails sent successfully'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    
    if (!body.formType || !body.purpose || !body.data) {
      console.error("Email request missing required parameters", {
        hasFormType: !!body.formType,
        hasPurpose: !!body.purpose,
        hasData: !!body.data
      });
      
      return NextResponse.json({
        status: 'failed',
        message: 'Missing required parameters'
      }, { status: 400 });
    }
    
    
    if (body.formType === 'corporate_styling') {
      return await handleCorporateStyleRequest(body.data, body.purpose);
    } 
    else if (body.formType === 'personalized_consultation') {
      return await handlePersonalizedConsultationRequest(body.data, body.purpose);
    }
    else if (body.formType === 'photoshoot_styling') {
      return await handlePhotoshootStyleRequest(body.data, body.purpose);
    }
    else if (body.formType === 'wedding_styling') {
      return await handleWeddingStylingRequest(body.data, body.purpose);
    }else if (body.formType === 'makeup_training') {
      return await handleMakeupTrainingRequest(body.data, body.purpose);
    }else if (body.formType === 'soft_skills') {
      return await handleSoftSkillsRequest(body.data, body.purpose);
    }else {
      return NextResponse.json({
        status: 'failed',
        message: `Unknown form type: ${body.formType}`
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error("Error processing email request:", error);
    return NextResponse.json({
      status: 'failed',
      message: 'Server error processing email request',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

function createTransporter() {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("Email configuration missing: MAIL_USER or MAIL_PASS not set");
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
}

// Send corporate styling form submission emails
async function sendCorporateFormSubmissionEmails(data: CorporateStyleData) {
  
  if (!data.contactInfo || !data.contactPersonName) {
    throw new Error("Missing contactInfo or contactPersonName in form data");
  }
  
  const transporter = createTransporter();
  
  // Client confirmation email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: data.contactInfo,
    subject: 'Your Corporate Styling Request is Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; text-align: center;">StylTara Studios</h1>
        <h2 style="color: #2d3748; text-align: center;">Request Received</h2>
        <p>Dear ${data.contactPersonName},</p>
        <p>Thank you for submitting your Corporate Styling request with Styltara Studios. 
        Your request has been received and is awaiting payment confirmation.</p>
        
        <p>Please complete the payment to confirm your booking.</p>

        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e2e8f0;">
        <p>Best Regards,<br><b>Team StylTara Studios</b></p>
        <a href="https://www.styltarastudios.com" style="color: #003274;">www.styltarastudios.com</a>
      </div>
    `
  });
  
  // Admin notification email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL ?? process.env.MAIL_USER,
    subject: 'New Corporate Styling Request Submitted',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2C383D; border-bottom: 2px solid #401735; padding-bottom: 10px;">New Corporate Styling Request</h2>
        <p>A new corporate styling request has been submitted.</p>
        <h3>Client Details:</h3>
        <ul>
          <li><strong>Company:</strong> ${data.companyName ?? 'N/A'}</li>
          <li><strong>Contact:</strong> ${data.contactPersonName || 'N/A'}</li>
          <li><strong>Email/Phone:</strong> ${data.contactInfo || 'N/A'}</li>
          <li><strong>Status:</strong> Payment Pending</li>
        </ul>
        <p>Please check the admin dashboard for full details.</p>
      </div>
    `
  });
  
  return true;
}

// Send corporate styling payment confirmation emails
async function sendCorporatePaymentConfirmationEmails(data: CorporateStyleData) {
  
  // Check for required fields
  if (!data.contactInfo) {
    throw new Error("Missing contactInfo in payment data");
  }
  
  if (!data.contactPersonName) {
    throw new Error("Missing contactPersonName in payment data");
  }
  
  const transporter = createTransporter();
  
  // Client payment confirmation email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: data.contactInfo,
    subject: 'Your Corporate Styling Session is Confirmed!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; text-align: center;">StylTara Studios</h1>
        <h2 style="color: #2d3748; text-align: center;">Your Payment is Confirmed!</h2>
        <p>Dear ${data.contactPersonName || 'Valued Customer'},</p>
        <p>We're delighted to confirm your <b>Corporate Styling</b> booking with <b>Styltara Studios Pvt Ltd!</b> 
        Your payment has been received and your session is now officially booked.</p>
        <div style="background-color: #f7fafc; border-left: 4px solid #401735; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-weight: 500;">Our team will contact you shortly with session logistics and next steps.</p>
        </div>
        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e2e8f0;">
        <p>Thank you for trusting us with your brand and image!</p>
        <p>Best Regards,<br><b>Team StylTara Studios</b></p>
        <a href="https://www.styltarastudios.com" style="color: #003274;">www.styltarastudios.com</a>
        <div style="margin-top: 30px; background-color: #1a202c; color: #e2e8f0; padding: 20px; text-align: center;">
          <p>© ${new Date().getFullYear()} StylTara Studios Pvt Ltd. All rights reserved.</p>
          <p style="font-size: 12px; color: #a0aec0;">Jaipur, Rajasthan</p>
        </div>
      </div>
    `
  });

  // Admin payment notification email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL ?? process.env.MAIL_USER,
    subject: 'Payment Received: Corporate Styling Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2C383D; border-bottom: 2px solid #401735; padding-bottom: 10px;">Payment Received for Corporate Styling</h2>
        <p>Payment has been received for the following corporate styling request.</p>
        <h3>Payment Details:</h3>
        <ul>
          <li><strong>Payment ID:</strong> ${data.paymentId ?? 'N/A'}</li>
          <li><strong>Order ID:</strong> ${data.orderId ?? 'N/A'}</li>
          <li><strong>Amount:</strong> ₹299</li>
          <li><strong>Date:</strong> ${data.paymentDate ? new Date(data.paymentDate).toLocaleString() : 'N/A'}</li>
        </ul>
        <h3>Client Details:</h3>
        <ul>
          <li><strong>Company:</strong> ${data.companyName ?? 'N/A'}</li>
          <li><strong>Contact:</strong> ${data.contactPersonName || 'N/A'}</li>
          <li><strong>Designation:</strong> ${data.designation || 'N/A'}</li>
          <li><strong>Email/Phone:</strong> ${data.contactInfo || 'N/A'}</li>
          <li><strong>Participants:</strong> ${data.numberOfParticipants || 'N/A'}${
            data.numberOfParticipants === '10+' && data.exactNumberOfParticipants 
              ? ' (' + data.exactNumberOfParticipants + ')' 
              : ''
          }</li>
          <li><strong>Service:</strong> ${data.serviceType || 'Corporate Styling'}</li>
          <li><strong>Location:</strong> ${data.companyLocation || 'N/A'}</li>
        </ul>
        <p>Please proceed with scheduling the session.</p>
      </div>
    `
  });
  
  return true;
}

// Send personalized consultation submission emails
async function sendPersonalizedConsultationSubmissionEmails(data: PersonalizedConsultationData) {
  
  if (!data.email || !data.fullName) {
    throw new Error("Missing email or fullName in form data");
  }
  
  const transporter = createTransporter();
  
  // Client confirmation email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: data.email,
    subject: 'Your Personalized Styling Consultation Requeest is Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; text-align: center;">StylTara Studios</h1>
        <h2 style="color: #2d3748; text-align: center;">Request Received</h2>
        <p>Dear ${data.fullName},</p>
        <p>Thank you for submitting your Personalized Styling Consultation request with Styltara Studios. 
        Your request has been received and is awaiting payment confirmation.</p>
        
        <p>Please complete the payment to confirm your booking.</p>

        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e2e8f0;">
        <p>Best Regards,<br><b>Team StylTara Studios</b></p>
        <a href="https://www.styltarastudios.com" style="color: #003274;">www.styltarastudios.com</a>
      </div>
    `
  });
  
  // Admin notification email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL ?? process.env.MAIL_USER,
    subject: 'New Personalized Styling Consultation Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2C383D; border-bottom: 2px solid #401735; padding-bottom: 10px;">New Styling Consultation Request</h2>
        <p>A new styling consultation has been requested on your platform.</p>
        
        <h3>Client Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.fullName || 'N/A'}</li>
          <li><strong>Email:</strong> ${data.email || 'N/A'}</li>
          <li><strong>Phone:</strong> ${data.phone || 'N/A'}</li>
          <li><strong>Consultation Mode:</strong> ${data.consultationMode || 'N/A'}</li>
          <li><strong>Age Group:</strong> ${data.ageGroup || 'N/A'}</li>
          <li><strong>Gender:</strong> ${data.gender || 'N/A'}</li>
          <li><strong>Location:</strong> ${data.location || 'N/A'}</li>
          <li><strong>Preferred Date/Time:</strong> ${
            data.preferredDateTime 
              ? new Date(data.preferredDateTime).toLocaleString() 
              : 'N/A'
          }</li>
        </ul>
        <p>Please check the admin dashboard for full details.</p>
      </div>
    `
  });
  
  return true;
}

// Send personalized consultation payment confirmation emails
async function sendPersonalizedConsultationPaymentEmails(data: PersonalizedConsultationData) {
  
  if (!data.email || !data.fullName) {
    throw new Error("Missing email or fullName in payment data");
  }
  
  const transporter = createTransporter();
  
  // Client payment confirmation email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: data.email,
    subject: 'Your Personalized Styling Consultation Payment is Confirmed!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; text-align: center;">StylTara Studios</h1>
        <h2 style="color: #2d3748; text-align: center;">Your Payment is Confirmed!</h2>
        <p>Dear ${data.fullName},</p>
        
        <p>We're delighted to confirm your payment for the <b>Personalized Styling Consultation</b> with <b>Styltara Studios!</b>We're excited to work with you on your unique style journey and help you express your authentic self with confidence.</p>
        
        <div style="background-color: #f7fafc; border-left: 4px solid #401735; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-weight: 500;">Your consultation is now officially booked for ${
            data.preferredDateTime 
              ? new Date(data.preferredDateTime).toLocaleString() 
              : 'the requested time'
          }.</p>
        </div>
        
        <p>Our styling expert will be in touch soon to confirm all details and prepare for your session.</p>
        
        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e2e8f0;">
        <p>Warm Regards,<br><b>Team StylTara Studios</b></p>
        <a href="https://www.styltarastudios.com" style="color: #003274;">www.styltarastudios.com</a>
      </div>
    `
  });
  
  // Admin payment notification email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL ?? process.env.MAIL_USER,
    subject: 'Payment Received: Personalized Styling Consultation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2C383D; border-bottom: 2px solid #401735; padding-bottom: 10px;">Payment Received for Styling Consultation</h2>
        <p>Payment has been received for the following styling consultation.</p>
        
        <h3>Payment Details:</h3>
        <ul>
          <li><strong>Payment ID:</strong> ${data.paymentId ?? 'N/A'}</li>
          <li><strong>Order ID:</strong> ${data.orderId ?? 'N/A'}</li>
        </ul>
        
        <h3>Client Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.fullName || 'N/A'}</li>
          <li><strong>Email:</strong> ${data.email || 'N/A'}</li>
          <li><strong>Phone:</strong> ${data.phone || 'N/A'}</li>
          <li><strong>Consultation Mode:</strong> ${data.consultationMode || 'N/A'}</li>
          <li><strong>Location:</strong> ${data.location || 'N/A'}</li>
          <li><strong>Preferred Date/Time:</strong> ${
            data.preferredDateTime 
              ? new Date(data.preferredDateTime).toLocaleString() 
              : 'N/A'
          }</li>
        </ul>
        
        <p>Please proceed with scheduling the consultation session.</p>
      </div>
    `
  });
  
  return true;
}


// Send photoshoot styling form submission emails
async function sendPhotoshootStylingSubmissionEmails(data: PhotoshootStyleData) {
  
  if (!data.email || !data.fullName) {
    throw new Error("Missing email or fullName in form data");
  }
  
  const transporter = createTransporter();
  
  // Client confirmation email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: data.email,
    subject: 'Your Photoshoot Styling Request is Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; text-align: center;">StylTara Studios</h1>
        <h2 style="color: #2d3748; text-align: center;">Request Received</h2>
        <p>Dear ${data.fullName},</p>
        <p>Thank you for submitting your Photoshoot Styling and Management request with Styltara Studios. 
        Your request has been received and is awaiting payment confirmation.</p>
        
        <p>Please complete the payment to confirm your booking.</p>

        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e2e8f0;">
        <p>Best Regards,<br><b>Team StylTara Studios</b></p>
        <a href="https://www.styltarastudios.com" style="color: #003274;">www.styltarastudios.com</a>
      </div>
    `
  });
  
  const attachments = [];
  if (data.references && Array.isArray(data.references) && data.references.length > 0) {
    for (let i = 0; i < data.references.length; i++) {
      const ref = data.references[i];
      if (ref.data) {
        let imageData: string | Buffer = ref.data;
        if (typeof imageData === 'string' && imageData.includes('base64,')) {
          imageData = Buffer.from(imageData.split('base64,')[1], 'base64');
        } else if (typeof imageData === 'string') {
          imageData = Buffer.from(imageData, 'base64');
        }
        
        attachments.push({
          filename: ref.name || `reference-${i+1}.${ref.type.split('/')[1] || 'jpg'}`,
          content: imageData,
          contentType: ref.type || 'image/jpeg'
        });
      }
    }
  }
  
  // Admin notification email with attachments
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL ?? process.env.MAIL_USER,
    subject: 'New Photoshoot Styling Request Submitted',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2C383D; border-bottom: 2px solid #401735; padding-bottom: 10px;">New Photoshoot Styling Request</h2>
        <p>A new photoshoot styling request has been submitted.</p>
        
        <h3>Client Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.fullName || 'N/A'}</li>
          <li><strong>Email:</strong> ${data.email || 'N/A'}</li>
          <li><strong>Phone:</strong> ${data.phone || 'N/A'}</li>
          <li><strong>Photoshoot Type:</strong> ${data.photoshootType || 'N/A'}</li>
          <li><strong>Location:</strong> ${data.location || 'N/A'}</li>
          <li><strong>Preferred Date:</strong> ${
            data.preferredDate 
              ? new Date(data.preferredDate).toLocaleString() 
              : 'N/A'
          }</li>
          <li><strong>Budget Range:</strong> ₹${data.budgetRange || 'N/A'}</li>
          <li><strong>Has Photographer:</strong> ${data.hasPhotographer || 'N/A'}</li>
          <li><strong>Needs Hair & Makeup:</strong> ${data.needsHairMakeup || 'N/A'}</li>
          ${data.theme ? `<li><strong>Theme:</strong> ${data.theme}</li>` : ''}
        </ul>
        
        <h3>Additional Requirements:</h3>
        <p>${data.stylingRequirements || 'None specified'}</p>
        
        ${data.additionalNotes ? `<h3>Notes:</h3><p>${data.additionalNotes}</p>` : ''}
        
        ${attachments.length > 0 ? 
          `<h3>Reference Images:</h3>
           <p>${attachments.length} reference image(s) attached to this email.</p>` 
          : ''
        }
      </div>
    `,
    attachments: attachments
  });
  
  return true;
}

// Send photoshoot styling payment confirmation emails
async function sendPhotoshootStylingPaymentEmails(data: PhotoshootStyleData) {
  
  if (!data.email || !data.fullName) {
    throw new Error("Missing email or fullName in payment data");
  }
  
  const transporter = createTransporter();
  
  // Client payment confirmation email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: data.email,
    subject: 'Your Photoshoot Styling Payment is Confirmed!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; text-align: center;">StylTara Studios</h1>
        <h2 style="color: #2d3748; text-align: center;">Your Payment is Confirmed!</h2>
        <p>Dear ${data.fullName},</p>
        
        <p>We're delighted to confirm your payment for <b>Photoshoot Styling Services</b> with <b>Styltara Studios!</b></p>
        
        <div style="background-color: #f7fafc; border-left: 4px solid #401735; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-weight: 500;">Your ${data.photoshootType || 'photoshoot'} styling is now officially booked for ${
            data.preferredDate 
              ? new Date(data.preferredDate).toLocaleString() 
              : 'the requested date'
          }.</p>
        </div>
        
        <p>Our styling team will be in touch shortly to discuss the creative direction, outfit selections, and all the details to make your photoshoot a success.</p>
        
        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e2e8f0;">
        <p>Warm Regards,<br><b>Team StylTara Studios</b></p>
        <a href="https://www.styltarastudios.com" style="color: #003274;">www.styltarastudios.com</a>
      </div>
    `
  });
  
  // Admin payment notification email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL ?? process.env.MAIL_USER,
    subject: 'Payment Received: Photoshoot Styling Services',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2C383D; border-bottom: 2px solid #401735; padding-bottom: 10px;">Payment Received for Photoshoot Styling</h2>
        <p>Payment has been received for the following photoshoot styling request.</p>
        
        <h3>Payment Details:</h3>
        <ul>
          <li><strong>Payment ID:</strong> ${data.paymentId ?? 'N/A'}</li>
          <li><strong>Order ID:</strong> ${data.orderId ?? 'N/A'}</li>
          <li><strong>Amount:</strong> ₹299</li>
          <li><strong>Date:</strong> ${data.paymentDate ? new Date(data.paymentDate).toLocaleString() : 'N/A'}</li>
        </ul>
        
        <h3>Client Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.fullName || 'N/A'}</li>
          <li><strong>Email:</strong> ${data.email || 'N/A'}</li>
          <li><strong>Phone:</strong> ${data.phone || 'N/A'}</li>
          <li><strong>Photoshoot Type:</strong> ${data.photoshootType || 'N/A'}</li>
          <li><strong>Location:</strong> ${data.location || 'N/A'}</li>
          <li><strong>Preferred Date:</strong> ${
            data.preferredDate 
              ? new Date(data.preferredDate).toLocaleString() 
              : 'N/A'
          }</li>
          <li><strong>Has Photographer:</strong> ${data.hasPhotographer || 'N/A'}</li>
          <li><strong>Needs Hair & Makeup:</strong> ${data.needsHairMakeup || 'N/A'}</li>
        </ul>
        
        <p>Please proceed with scheduling the styling session.</p>
      </div>
    `
  });
  
  return true;
}

// Send wedding styling form submission emails
async function sendWeddingStylingSubmissionEmails(data: WeddingStylingData) {
  
  if (!data.contactEmail || !data.fullName) {
    throw new Error("Missing contactEmail or fullName in form data");
  }
  
  const transporter = createTransporter();
  
  // Client confirmation email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: data.contactEmail,
    subject: 'Your Wedding Styling Request is Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; text-align: center;">StylTara Studios</h1>
        <h2 style="color: #2d3748; text-align: center;">Request Received</h2>
        <p>Dear ${data.fullName},</p>
        <p>Thank you for submitting your Wedding Styling & Photoshoot request with Styltara Studios. 
        Your request has been received and is awaiting payment confirmation.</p>
        
        <p>Please complete the payment to confirm your booking.</p>

        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e2e8f0;">
        <p>Best Regards,<br><b>Team StylTara Studios</b></p>
        <a href="https://www.styltarastudios.com" style="color: #003274;">www.styltarastudios.com</a>
      </div>
    `
  });
  
const attachments = [];
  if (data.inspirationImages && Array.isArray(data.inspirationImages) && data.inspirationImages.length > 0) {
    for (let i = 0; i < data.inspirationImages.length; i++) {
      const img = data.inspirationImages[i];
      if (img.data) {
        let imageData: string | Buffer = img.data;
        if (typeof imageData === 'string' && imageData.includes('base64,')) {
          imageData = Buffer.from(imageData.split('base64,')[1], 'base64');
        } else if (typeof imageData === 'string') {
          imageData = Buffer.from(imageData, 'base64');
        }
        
        attachments.push({
          filename: img.name || `inspiration-${i+1}.${img.type.split('/')[1] || 'jpg'}`,
          content: imageData,
          contentType: img.type || 'image/jpeg'
        });
      }
    }
  }
  
  // Admin notification email with attachments
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL ?? process.env.MAIL_USER,
    subject: 'New Wedding Styling Request Submitted',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2C383D; border-bottom: 2px solid #401735; padding-bottom: 10px;">New Wedding Styling Request</h2>
        <p>A new wedding styling request has been submitted.</p>
        
        <h3>Client Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.fullName || 'N/A'}</li>
          <li><strong>Email:</strong> ${data.contactEmail || 'N/A'}</li>
          <li><strong>Phone:</strong> ${data.contactPhone || 'N/A'}</li>
          <li><strong>Wedding Location:</strong> ${data.weddingLocation || 'N/A'}</li>
          <li><strong>Wedding Date:</strong> ${
            data.weddingDate 
              ? new Date(data.weddingDate).toLocaleDateString() 
              : 'N/A'
          }</li>
          <li><strong>Package Selected:</strong> ${data.package || 'N/A'}</li>
          <li><strong>Budget Range:</strong> ${data.budgetRange || 'N/A'}</li>
          <li><strong>Events:</strong> ${Array.isArray(data.events) ? data.events.join(', ') : data.events || 'N/A'}</li>
          <li><strong>Has Vendors:</strong> ${data.hasVendors || 'N/A'}</li>
          <li><strong>Consultation Mode:</strong> ${data.consultationMode || 'N/A'}</li>
        </ul>
        
        ${data.additionalNotes ? `<h3>Additional Notes:</h3><p>${data.additionalNotes}</p>` : ''}
        
        ${attachments.length > 0 ? 
          `<h3>Inspiration Images:</h3>
           <p>${attachments.length} inspiration image(s) attached to this email.</p>` 
          : ''
        }
      </div>
    `,
    attachments: attachments
  });
  
  return true;
}

// Send wedding styling payment confirmation emails
async function sendWeddingStylingPaymentEmails(data: WeddingStylingData) {
  
  if (!data.contactEmail || !data.fullName) {
    throw new Error("Missing contactEmail or fullName in payment data");
  }
  
  const transporter = createTransporter();
  
  // Client payment confirmation email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: data.contactEmail,
    subject: 'Your Wedding Styling Payment is Confirmed!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; text-align: center;">StylTara Studios</h1>
        <h2 style="color: #2d3748; text-align: center;">Your Payment is Confirmed!</h2>
        <p>Dear ${data.fullName},</p>
        
        <p>Congratulations on your upcoming celebration!</p>
        <p>We're delighted to confirm your payment for <b>Wedding Styling Services</b> with <b>Styltara Studios!</b> </p>
        
        <div style="background-color: #f7fafc; border-left: 4px solid #401735; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-weight: 500;">Your ${data.package || 'wedding styling'} package is now officially booked for your wedding on ${
            data.weddingDate 
              ? new Date(data.weddingDate).toLocaleDateString() 
              : 'the requested date'
          }.</p>
        </div>
        
        <p>We're honored to be part of your special journey and committed to making every moment stylish and memorable. <br/> Looking forward to creating timeless elegance with you!</p>
        
        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e2e8f0;">
        <p>With Love, <br/><b>Team StylTara Studios</b></p>
        <a href="https://www.styltarastudios.com" style="color: #003274;">www.styltarastudios.com</a>
      </div>
    `
  });
  
  // Admin payment notification email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL ?? process.env.MAIL_USER,
    subject: 'Payment Received: Wedding Styling Services',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2C383D; border-bottom: 2px solid #401735; padding-bottom: 10px;">Payment Received for Wedding Styling</h2>
        <p>Payment has been received for the following wedding styling request.</p>
        
        <h3>Payment Details:</h3>
        <ul>
          <li><strong>Payment ID:</strong> ${data.paymentId ?? 'N/A'}</li>
          <li><strong>Order ID:</strong> ${data.orderId ?? 'N/A'}</li>
          <li><strong>Amount:</strong> ₹299</li>
          <li><strong>Date:</strong> ${data.paymentDate ? new Date(data.paymentDate).toLocaleString() : 'N/A'}</li>
        </ul>
        
        <h3>Client Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.fullName || 'N/A'}</li>
          <li><strong>Email:</strong> ${data.contactEmail || 'N/A'}</li>
          <li><strong>Phone:</strong> ${data.contactPhone || 'N/A'}</li>
          <li><strong>Wedding Date:</strong> ${
            data.weddingDate 
              ? new Date(data.weddingDate).toLocaleDateString() 
              : 'N/A'
          }</li>
          <li><strong>Package Selected:</strong> ${data.package || 'N/A'}</li>
          <li><strong>Events:</strong> ${Array.isArray(data.events) ? data.events.join(', ') : 'N/A'}</li>
        </ul>
        
        <p>Please proceed with scheduling the consultation and styling planning sessions.</p>
      </div>
    `
  });
  
  return true;
}

// Send makeup training form submission emails
async function sendMakeupTrainingSubmissionEmails(data: MakeupTrainingData) {
  
  if (!data.contactEmail || !data.fullName) {
    throw new Error("Missing contactEmail or fullName in form data");
  }
  
  const transporter = createTransporter();
  
  // Client confirmation email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: data.contactEmail,
    subject: 'Your Makeup & Styling Training Request is Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; text-align: center;">StylTara Studios</h1>
        <h2 style="color: #2d3748; text-align: center;">Request Received</h2>
        <p>Dear ${data.fullName},</p>
        <p>Thank you for submitting your Makeup & Styling Training request with Styltara Studios. 
        Your request has been received and is awaiting payment confirmation.</p>
        
        <p>Please complete the payment to confirm your booking.</p>

        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e2e8f0;">
        <p>Best Regards,<br><b>Team StylTara Studios</b></p>
        <a href="https://www.styltarastudios.com" style="color: #003274;">www.styltarastudios.com</a>
      </div>
    `
  });
  
  // Admin notification email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL ?? process.env.MAIL_USER,
    subject: 'New Makeup & Styling Training Request Submitted',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2C383D; border-bottom: 2px solid #401735; padding-bottom: 10px;">New Makeup & Styling Training Request</h2>
        <p>A new training request has been submitted.</p>
        
        <h3>Client Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.fullName || 'N/A'}</li>
          <li><strong>Email:</strong> ${data.contactEmail || 'N/A'}</li>
          <li><strong>Phone:</strong> ${data.contactPhone || 'N/A'}</li>
          <li><strong>Consultation Mode:</strong> ${data.consultationMode || 'N/A'}</li>
          <li><strong>Area of Interest:</strong> ${data.areaOfInterest || 'N/A'}</li>
          <li><strong>Has Background:</strong> ${data.hasBackground || 'N/A'}</li>
          ${data.backgroundDetails ? `<li><strong>Background Details:</strong> ${data.backgroundDetails}</li>` : ''}
          <li><strong>Preferred Language:</strong> ${data.preferredLanguage || 'N/A'}</li>
          <li><strong>Preferred Date/Time:</strong> ${
            data.preferredDateTime 
              ? new Date(data.preferredDateTime).toLocaleString() 
              : 'N/A'
          }</li>
          ${data.trainingLocation ? `<li><strong>Training Location:</strong> ${data.trainingLocation}</li>` : ''}
        </ul>
        
        ${data.trainingReason ? `<h3>Reason for Training:</h3><p>${data.trainingReason}</p>` : ''}
        ${data.additionalQuestions ? `<h3>Additional Questions:</h3><p>${data.additionalQuestions}</p>` : ''}
        
        <p>Please check the admin dashboard for full details.</p>
      </div>
    `
  });
  
  return true;
}

// Send makeup training payment confirmation emails
async function sendMakeupTrainingPaymentEmails(data: MakeupTrainingData) {
  
  if (!data.contactEmail || !data.fullName) {
    throw new Error("Missing contactEmail or fullName in payment data");
  }
  
  const transporter = createTransporter();
  
  // Client payment confirmation email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: data.contactEmail,
    subject: 'Your Makeup & Styling Training Payment is Confirmed!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; text-align: center;">StylTara Studios</h1>
        <h2 style="color: #2d3748; text-align: center;">Your Payment is Confirmed!</h2>
        <p>Dear ${data.fullName},</p>
        
        <p>We're delighted to confirm your payment for <b>Makeup & Styling Training</b> with <b>Styltara Studios!</b> Thank you for enrolling in our Makeup & Styling Training program. You’re one step closer to mastering the skills and creativity needed in the world of beauty and fashion.
        We will shortly share the course schedule, and preparation guidelines.</p>
        
        <div style="background-color: #f7fafc; border-left: 4px solid #401735; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-weight: 500;">Your ${data.areaOfInterest || 'makeup and styling'} training session is now officially booked for ${
            data.preferredDateTime 
              ? new Date(data.preferredDateTime).toLocaleString() 
              : 'the requested time'
          }.</p>
        </div>
        
        <p>Excited to see you grow with us!</p>
        
        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e2e8f0;">
        <p>Best,<br><b>Team StylTara Studios</b></p>
        <a href="https://www.styltarastudios.com" style="color: #003274;">www.styltarastudios.com</a>
      </div>
    `
  });
  
  // Admin payment notification email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL ?? process.env.MAIL_USER,
    subject: 'Payment Received: Makeup & Styling Training',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2C383D; border-bottom: 2px solid #401735; padding-bottom: 10px;">Payment Received for Makeup & Styling Training</h2>
        <p>Payment has been received for the following training request.</p>
        
        <h3>Payment Details:</h3>
        <ul>
          <li><strong>Payment ID:</strong> ${data.paymentId ?? 'N/A'}</li>
          <li><strong>Order ID:</strong> ${data.orderId ?? 'N/A'}</li>
          <li><strong>Amount:</strong> ₹299</li>
          <li><strong>Date:</strong> ${data.paymentDate ? new Date(data.paymentDate).toLocaleString() : 'N/A'}</li>
        </ul>
        
        <h3>Client Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.fullName || 'N/A'}</li>
          <li><strong>Email:</strong> ${data.contactEmail || 'N/A'}</li>
          <li><strong>Phone:</strong> ${data.contactPhone || 'N/A'}</li>
          <li><strong>Consultation Mode:</strong> ${data.consultationMode || 'N/A'}</li>
          <li><strong>Area of Interest:</strong> ${data.areaOfInterest || 'N/A'}</li>
          <li><strong>Preferred Date/Time:</strong> ${
            data.preferredDateTime 
              ? new Date(data.preferredDateTime).toLocaleString() 
              : 'N/A'
          }</li>
        </ul>
        
        <p>Please proceed with scheduling the training session.</p>
      </div>
    `
  });
  
  return true;
}

// Send soft skills form submission emails
async function sendSoftSkillsSubmissionEmails(data: SoftSkillsData) {
  
  if (!data.contactEmail || !data.fullName) {
    throw new Error("Missing contactEmail or fullName in form data");
  }
  
  const transporter = createTransporter();
  
  // Client confirmation email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: data.contactEmail,
    subject: 'Your Soft Skills & Etiquette Coaching Request is Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; text-align: center;">StylTara Studios</h1>
        <h2 style="color: #2d3748; text-align: center;">Request Received</h2>
        <p>Dear ${data.fullName},</p>
        <p>Thank you for submitting your Soft Skills & Etiquette Coaching request with Styltara Studios. 
        Your request has been received and is awaiting payment confirmation.</p>
        
        <p>Please complete the payment to confirm your booking.</p>

        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e2e8f0;">
        <p>Best Regards,<br><b>Team StylTara Studios</b></p>
        <a href="https://www.styltarastudios.com" style="color: #003274;">www.styltarastudios.com</a>
      </div>
    `
  });
  
  // Admin notification email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL ?? process.env.MAIL_USER,
    subject: 'New Soft Skills & Etiquette Coaching Request Submitted',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2C383D; border-bottom: 2px solid #401735; padding-bottom: 10px;">New Soft Skills Coaching Request</h2>
        <p>A new soft skills coaching request has been submitted.</p>
        
        <h3>Client Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.fullName || 'N/A'}</li>
          <li><strong>Email:</strong> ${data.contactEmail || 'N/A'}</li>
          <li><strong>Phone:</strong> ${data.contactPhone || 'N/A'}</li>
          <li><strong>Occupation:</strong> ${data.occupation || 'N/A'}</li>
          <li><strong>Coaching Purpose:</strong> ${data.coachingPurpose || 'N/A'}</li>
          <li><strong>Coaching Mode:</strong> ${data.coachingMode || 'N/A'}</li>
          <li><strong>Previous Coaching:</strong> ${data.hasPreviousCoaching || 'N/A'}</li>
          <li><strong>Preferred Language:</strong> ${data.preferredLanguage || 'N/A'}</li>
          <li><strong>Preferred Date/Time:</strong> ${
            data.preferredDateTime 
              ? new Date(data.preferredDateTime).toLocaleString() 
              : 'N/A'
          }</li>
        </ul>
        
        ${data.additionalExpectations ? `<h3>Additional Expectations:</h3><p>${data.additionalExpectations}</p>` : ''}
        
        <p>Please check the admin dashboard for full details.</p>
      </div>
    `
  });
  
  return true;
}

// Send soft skills payment confirmation emails
async function sendSoftSkillsPaymentEmails(data: SoftSkillsData) {
  
  if (!data.contactEmail || !data.fullName) {
    throw new Error("Missing contactEmail or fullName in payment data");
  }
  
  const transporter = createTransporter();
  
  // Client payment confirmation email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: data.contactEmail,
    subject: 'Your Soft Skills & Etiquette Coaching Payment is Confirmed!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; text-align: center;">StylTara Studios</h1>
        <h2 style="color: #2d3748; text-align: center;">Your Payment is Confirmed!</h2>
        <p>Dear ${data.fullName},</p>
        
        <p>We're delighted to confirm your payment for <b>Soft Skills & Etiquette Coaching</b> with <b>Styltara Studios!</b>We’re excited to support your personal and professional growth with customized, impactful sessions.</p>
        
        <div style="background-color: #f7fafc; border-left: 4px solid #401735; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-weight: 500;">Your coaching session focusing on ${data.coachingPurpose || 'soft skills development'} is now officially booked for ${
            data.preferredDateTime 
              ? new Date(data.preferredDateTime).toLocaleString() 
              : 'the requested time'
          }.</p>
        </div>
        
        <p>We look forward to working together to enhance your confidence and presence.</p>
        
        <hr style="margin: 30px 0; border: none; height: 1px; background-color: #e2e8f0;">
        <p>Sincerely,<br><b>Team StylTara Studios</b></p>
        <a href="https://www.styltarastudios.com" style="color: #003274;">www.styltarastudios.com</a>
      </div>
    `
  });
  
  // Admin payment notification email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL ?? process.env.MAIL_USER,
    subject: 'Payment Received: Soft Skills & Etiquette Coaching',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2C383D; border-bottom: 2px solid #401735; padding-bottom: 10px;">Payment Received for Soft Skills Coaching</h2>
        <p>Payment has been received for the following soft skills coaching request.</p>
        
        <h3>Payment Details:</h3>
        <ul>
          <li><strong>Payment ID:</strong> ${data.paymentId ?? 'N/A'}</li>
          <li><strong>Order ID:</strong> ${data.orderId ?? 'N/A'}</li>
          <li><strong>Amount:</strong> ₹2999</li>
          <li><strong>Date:</strong> ${data.paymentDate ? new Date(data.paymentDate).toLocaleString() : 'N/A'}</li>
        </ul>
        
        <h3>Client Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.fullName || 'N/A'}</li>
          <li><strong>Email:</strong> ${data.contactEmail || 'N/A'}</li>
          <li><strong>Phone:</strong> ${data.contactPhone || 'N/A'}</li>
          <li><strong>Occupation:</strong> ${data.occupation || 'N/A'}</li>
          <li><strong>Coaching Purpose:</strong> ${data.coachingPurpose || 'N/A'}</li>
          <li><strong>Coaching Mode:</strong> ${data.coachingMode || 'N/A'}</li>
          <li><strong>Preferred Date/Time:</strong> ${
            data.preferredDateTime 
              ? new Date(data.preferredDateTime).toLocaleString() 
              : 'N/A'
          }</li>
        </ul>
        
        <p>Please proceed with scheduling the coaching session.</p>
      </div>
    `
  });
  
  return true;
}