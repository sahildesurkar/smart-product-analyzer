import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ({ children }) => {
    const variants = {
        initial: {
            opacity: 0,
            y: 20,
            scale: 0.98
        },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1]
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            scale: 0.98,
            transition: {
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    return (
        <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ width: '100%', minHeight: '80vh' }}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
