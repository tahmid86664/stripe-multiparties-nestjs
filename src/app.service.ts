import { Injectable, Res } from '@nestjs/common';
import { Response } from 'express';
import Stripe from 'stripe';
import { PaymentDto } from './payment.dto';
import 'dotenv/config';

@Injectable()
export class AppService {
  stripe = new Stripe(process.env.STRIPE_SECRET, {
    apiVersion: '2022-11-15',
  });

  calculateChargeInCents = (items): number => {
    let total = items.map((item) => {
      return item.unitPrice * item.quantity; // considering unitPrice in USD
    });
    const getSum = (total, value) => {
      return total + value;
    };

    let totalAmount = total.reduce(getSum);
    console.log(totalAmount);
    let commission = 4 / 100;
    let charge = totalAmount * commission * 100;

    return charge;
  };

  getHello(): string {
    return 'Hello from stripe payment';
  }

  createAccount = async () => {
    const account = await this.stripe.accounts.create({
      country: 'US',
      type: 'custom',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    return account;
  };

  async updateAccount(accId: string) {
    const account = await this.stripe.accounts.update(accId, {
      tos_acceptance: { date: 1609798905, ip: '8.8.8.8' },
    });

    return account;
  }

  async createAccountLink(acc_id: string) {
    const accountLink = await this.stripe.accountLinks.create({
      account: acc_id,
      refresh_url: 'http://localhost:8008/api/v1/stripe/reauth',
      return_url: 'http://localhost:8008/api/v1/stripe/return',
      type: 'account_onboarding',
    });

    console.log(accountLink);
    return accountLink;
  }

  async doPayment() {
    const items = [
      {
        id: 1,
        name: 'Black T-Shirt',
        description: 'Its a black t-shirt for test',
        images: [
          'https://images.unsplash.com/photo-1571455786673-9d9d6c194f90?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        ],
        quantity: 1,
        unitPrice: 80,
      },
      {
        id: 2,
        name: 'White Shirt',
        description: 'Its a white shirt for test',
        images: [
          'https://images.unsplash.com/photo-1612541122840-bf7071c968a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=496&q=80',
        ],
        quantity: 2,
        unitPrice: 120,
      },
    ];

    const session = await this.stripe.checkout.sessions.create({
      line_items: items.map((item) => {
        return {
          quantity: item.quantity,
          price_data: {
            currency: 'usd',
            unit_amount: item.unitPrice * 100,
            product_data: {
              name: item.name,
              description: item.description,
              images: item.images,
            },
          },
        };
      }),
      mode: 'payment',
      success_url: 'https://localhost:8008/api/v1/stripe/payment/success',
      cancel_url: 'https://localhost:8008/api/v1/stripe/payment/cancel',
      payment_intent_data: {
        application_fee_amount: this.calculateChargeInCents(items),
        transfer_data: {
          destination: 'acct_1M7MkURkIRrUSIaY',
        },
      },
    });

    return session;
  }

  async getAccounts() {
    const response = await this.stripe.accounts.list();
    return response;
  }

  async getAccount(accId) {
    const response = await this.stripe.accounts.list();
    return response.data.filter((acc) => acc.id === accId)[0];
  }

  // creating acc with all info
  createNewAccount = async () => {
    const account = await this.stripe.accounts.create({
      country: 'US',
      type: 'custom',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        first_name: 'Lonnie',
        last_name: 'Parisian',
        email: 'xyz@gmail.com',
        dob: {
          day: 16,
          month: 11,
          year: 1958,
        },
        address: {
          line1: '264 Alicia Trail',
          city: 'Laupahoehoe',
          postal_code: '96764',
          state: 'HI', // see documentation must cause state shorthand
          country: 'US',
        },
        phone: '+1-823-315-2329',
        ssn_last_4: '0000',
      },
      email: 'xyz@gmail.com',
      external_account: {
        object: 'bank_account',
        account_number: '000999999991',
        routing_number: '110000000',
        country: 'US',
        currency: 'usd',
      },
      business_profile: {
        mcc: '7997', // see documentation; this code is for country club
        support_url: 'www.abc.com',
        url: 'www.abc.com',
      },
      tos_acceptance: {
        date: 1609798905,
        ip: '8.8.8.8',
      },
    });
    return account;
  };
}
