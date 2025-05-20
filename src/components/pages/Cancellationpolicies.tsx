"use client";

import React from 'react';
import { motion } from 'framer-motion';

const CancellationPolicies = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        duration: 0.8
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="bg-white shadow-xl rounded-lg overflow-hidden"
          variants={itemVariants}
        >
          <div className="bg-[#401735] py-6 px-6">
            <h1 className="text-3xl font-bold text-white">Cancellation Policy</h1>
          </div>
          
          <div className="px-6 py-8 prose prose-rose max-w-none">
            <motion.section variants={itemVariants} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cancellation and Refund Policy</h2>
              <ul className="list-disc pl-5 text-gray-700 space-y-4">
                <li>
                  <span className="font-medium">Cancellation made more than 7 days before the appointment:</span> 90% refund (10% processing fee).
                </li>
                
                <li>
                  <span className="font-medium">Cancellation made between 3–7 days:</span> 50% refund.
                </li>
                
                <li>
                  <span className="font-medium">Cancellation made less than 3 days before appointment:</span> No refund.
                </li>
                
                <li>
                  <span className="font-medium">Rescheduling is allowed once if requested at least 48 hours in advance.</span>
                </li>
              </ul>
                        <div className="mt-10 text-sm text-gray-500">
              <p>
                If you have any questions about these Terms and Conditions, please contact us at{' '}
                <a href="mailto:info@styltarastudios.com" className="text-[#401735] hover:underline">
                  styltarainfo@gmail.com
                </a>
              </p>
            </div>
            </motion.section>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
};

export default CancellationPolicies;