'use client';

import { IGRPDatePickerSingle } from "@igrp/igrp-framework-react-design-system";
import { FormProvider, useForm } from "react-hook-form";

export default function TestPage() {  
  const methods = useForm({});

    const onSubmit = methods.handleSubmit((data) => {
      alert(JSON.stringify(data, null, 2));
    });

    return (
      <FormProvider {...methods}>
        <form
          onSubmit={onSubmit}
          className='space-y-4 max-w-xl p-4'
        >
          <IGRPDatePickerSingle  
            name= "bookingDate"
            label= "Booking Date"
            helperText= "Pick a date"
            required
          />
          <button
            type='submit'
            className='bg-primary text-white px-4 py-2 rounded-md'
          >
            Submit
          </button>
        </form>
      </FormProvider>
    );
}